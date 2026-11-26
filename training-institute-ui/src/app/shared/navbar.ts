import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark app-navbar shadow-sm">
      <div class="container-fluid px-3 px-lg-4">
        <a class="navbar-brand fw-semibold d-flex align-items-center gap-2" routerLink="/dashboard">
          <i class="bi bi-mortarboard-fill"></i> BatchWise
        </a>
        <button class="navbar-toggler" type="button" (click)="open.set(!open())"
                [attr.aria-expanded]="open()" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" [class.show]="open()">
          <ul class="navbar-nav ms-auto align-items-lg-center">
            @for (link of links(); track link.path) {
              <li class="nav-item">
                <a class="nav-link" [routerLink]="link.path" routerLinkActive="active"
                   (click)="open.set(false)">
                  <i class="bi {{ link.icon }} me-1"></i>{{ link.label }}
                </a>
              </li>
            }
            @if (auth.user(); as u) {
              <li class="nav-item dropdown ms-lg-2" (click)="$event.stopPropagation()">
                <button class="nav-link dropdown-toggle d-flex align-items-center gap-2" type="button"
                        [attr.aria-expanded]="menu()" (click)="menu.set(!menu())">
                  <span class="avatar">{{ initials() }}</span>
                  <span class="d-lg-none d-xl-inline">{{ u.fullName }}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="menu()">
                  <li class="px-3 py-2">
                    <div class="fw-semibold">{{ u.fullName }}</div>
                    <div class="small text-body-secondary">{{ u.username }} · {{ u.role === 'ADMIN' ? 'Admin' : 'Staff' }}</div>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li><a class="dropdown-item" routerLink="/account/password" (click)="close()">
                    <i class="bi bi-key me-2"></i>Change password</a></li>
                  <li><button class="dropdown-item" type="button" (click)="logout()">
                    <i class="bi bi-box-arrow-right me-2"></i>Sign out</button></li>
                </ul>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `,
})
export class Navbar {
  readonly auth = inject(AuthService);
  readonly open = signal(false);
  readonly menu = signal(false);

  private readonly baseLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/courses', label: 'Courses', icon: 'bi-journal-bookmark' },
    { path: '/trainers', label: 'Trainers', icon: 'bi-person-badge' },
    { path: '/students', label: 'Students', icon: 'bi-people' },
    { path: '/batches', label: 'Batches', icon: 'bi-calendar3' },
    { path: '/enrolments', label: 'Enrolments', icon: 'bi-person-check' },
  ];
  readonly links = computed(() => this.auth.isAdmin()
    ? [...this.baseLinks, { path: '/users', label: 'Users', icon: 'bi-shield-lock' }]
    : this.baseLinks);

  readonly initials = computed(() => (this.auth.user()?.fullName ?? '?')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(''));

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeMenu() {
    this.menu.set(false);
  }

  close() {
    this.menu.set(false);
    this.open.set(false);
  }

  logout() {
    this.close();
    this.auth.logout();
  }
}
