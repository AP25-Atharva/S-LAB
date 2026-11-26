import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { User } from '../../core/models';
import { ConfirmService, ToastService } from '../../core/ui.services';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink, DatePipe, PageHeader, LoadState, StatusBadge],
  template: `
    <app-page-header title="Users" subtitle="Staff accounts that can sign in to BatchWise">
      <a class="btn btn-primary" routerLink="/users/new"><i class="bi bi-person-plus me-1"></i>Add user</a>
    </app-page-header>

    <div class="card">
      <div class="card-body border-bottom small text-body-secondary">
        <strong>Admin</strong>: everything, including deleting records and managing users.
        <strong>Staff</strong>: view, add and edit, but cannot delete.
      </div>
      <app-load-state [loading]="loading()" [error]="error()" [empty]="!loading() && users().length === 0"
                      emptyText="No users yet." />
      @if (!loading() && users().length > 0) {
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Last sign-in</th><th></th></tr>
            </thead>
            <tbody>
              @for (u of users(); track u.userId) {
                <tr>
                  <td class="fw-semibold">
                    {{ u.username }}
                    @if (u.userId === me()?.userId) { <span class="badge text-bg-light border ms-1">you</span> }
                  </td>
                  <td>{{ u.fullName }}</td>
                  <td>
                    <span class="badge" [class.text-bg-primary]="u.role === 'ADMIN'"
                          [class.text-bg-secondary]="u.role === 'STAFF'">{{ u.role === 'ADMIN' ? 'Admin' : 'Staff' }}</span>
                  </td>
                  <td><app-status-badge [status]="u.active" /></td>
                  <td class="small tabular">{{ u.lastLoginAt ? (u.lastLoginAt | date: 'd MMM y, h:mm a') : 'Never' }}</td>
                  <td class="actions-cell">
                    <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/users', u.userId, 'edit']" title="Edit">
                      <i class="bi bi-pencil"></i></a>
                    @if (u.userId !== me()?.userId) {
                      <button class="btn btn-sm btn-outline-danger ms-1" (click)="remove(u)" title="Delete">
                        <i class="bi bi-trash"></i></button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class UserListPage implements OnInit {
  private readonly api = inject(UserService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  readonly me = inject(AuthService).user;

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: list => { this.users.set(list); this.error.set(null); this.loading.set(false); },
      error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
    });
  }

  async remove(u: User) {
    const ok = await this.confirm.ask({
      title: 'Delete user',
      message: `Delete the account ${u.username} (${u.fullName})? They will be signed out and can no longer log in. To keep the record, deactivate it instead.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.delete(u.userId).subscribe({
      next: () => { this.toast.success(`${u.username} deleted`); this.load(); },
      error: e => this.toast.error(toApiError(e).message),
    });
  }
}
