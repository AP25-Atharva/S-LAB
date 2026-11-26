import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, User } from './models';

const STORAGE_KEY = 'batchwise.session';

interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

/** Holds the logged-in user and their token. The token is kept in localStorage until it expires. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(readStoredSession());
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  constructor() {
    this.scheduleExpiry();
  }

  get token(): string | null {
    return this.session()?.token ?? null;
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(tap(res => this.store(res)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/change-password`, { currentPassword, newPassword })
      .pipe(tap(res => this.store(res)));
  }

  /** Re-reads the current user (picks up name/role changes made by an admin). */
  refresh(): void {
    if (!this.session()) return;
    this.http.get<User>(`${environment.apiUrl}/auth/me`).subscribe({
      next: user => this.session.update(s => (s ? { ...s, user } : s)),
    });
  }

  logout(reason?: 'expired'): void {
    this.session.set(null);
    clearTimeout(this.expiryTimer);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
    const returnUrl = reason === 'expired' ? this.router.url : undefined;
    this.router.navigate(['/login'], {
      queryParams: { ...(reason ? { reason } : {}), ...(returnUrl && returnUrl !== '/login' ? { returnUrl } : {}) },
    });
  }

  private store(res: LoginResponse) {
    const s: Session = { token: res.token, expiresAt: res.expiresAt, user: res.user };
    this.session.set(s);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
    this.scheduleExpiry();
  }

  private scheduleExpiry() {
    clearTimeout(this.expiryTimer);
    const s = this.session();
    if (!s) return;
    const ms = new Date(s.expiresAt).getTime() - Date.now();
    // setTimeout overflows past ~24.8 days; tokens last hours, so this is just a guard
    this.expiryTimer = setTimeout(() => this.logout('expired'), Math.min(Math.max(ms, 0), 2 ** 31 - 1));
  }
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.token || !s.expiresAt || new Date(s.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}
