import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/api.services';
import { applyServerErrors, toApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../core/models';
import { PASSWORD_HINT, PASSWORD_PATTERN_MESSAGE, PASSWORD_VALIDATORS } from '../../core/password-rules';
import { ToastService } from '../../core/ui.services';
import { FieldError } from '../../shared/field-error';
import { LoadState, PageHeader } from '../../shared/page-bits';

const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink, FieldError, PageHeader, LoadState],
  template: `
    <app-page-header [title]="id() ? 'Edit user' : 'Add user'" backLink="/users" backLabel="Users" />
    <app-load-state [loading]="loading()" [error]="loadError()" />

    @if (!loading() && !loadError()) {
      <form class="card mb-4" style="max-width: 40rem" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="card-body">
          @if (formError().length) {
            <div class="alert alert-danger" role="alert">@for (m of formError(); track m) { <div>{{ m }}</div> }</div>
          }
          <div class="row g-3">
            <div class="col-12 col-md-5">
              <label class="form-label" for="username">Username<span class="req">*</span></label>
              <input id="username" class="form-control" formControlName="username" autocomplete="off"
                     autocapitalize="none" spellcheck="false" [class.is-invalid]="invalid('username')" />
              @if (id()) { <div class="form-text">Usernames can't be changed.</div> }
              <app-field-error [control]="form.get('username')" label="Username"
                               patternMessage="Use only letters, digits, '.', '-' and '_'" />
            </div>
            <div class="col-12 col-md-7">
              <label class="form-label" for="fullName">Full name<span class="req">*</span></label>
              <input id="fullName" class="form-control" formControlName="fullName" [class.is-invalid]="invalid('fullName')" />
              <app-field-error [control]="form.get('fullName')" label="Full name" />
            </div>
            @if (!id()) {
              <div class="col-12">
                <label class="form-label" for="password">Initial password<span class="req">*</span></label>
                <input id="password" type="password" class="form-control" formControlName="password"
                       autocomplete="new-password" [class.is-invalid]="invalid('password')" />
                <div class="form-text">{{ hint }} Share it privately; they can change it after signing in.</div>
                <app-field-error [control]="form.get('password')" label="Password" [patternMessage]="patternMessage" />
              </div>
            }
            <div class="col-12 col-md-5">
              <label class="form-label" for="role">Role<span class="req">*</span></label>
              <select id="role" class="form-select" formControlName="role">
                <option value="STAFF">Staff – view, add, edit</option>
                <option value="ADMIN">Admin – full access</option>
              </select>
            </div>
            <div class="col-12 col-md-7 d-flex align-items-end">
              <div class="form-check form-switch mb-2">
                <input id="active" type="checkbox" class="form-check-input" formControlName="active" />
                <label class="form-check-label" for="active">Active (can sign in)</label>
              </div>
            </div>
            @if (isSelf()) {
              <div class="col-12"><div class="form-text">This is your account, so you can't remove your own admin role or deactivate it.</div></div>
            }
          </div>
        </div>
        <div class="card-footer bg-body d-flex justify-content-end gap-2">
          <a class="btn btn-outline-secondary" routerLink="/users">Cancel</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
            {{ id() ? 'Save changes' : 'Create user' }}
          </button>
        </div>
      </form>

      @if (id()) {
        <form class="card" style="max-width: 40rem" [formGroup]="resetForm" (ngSubmit)="resetPassword()" novalidate>
          <div class="card-body">
            <h2 class="h6">Reset password</h2>
            <p class="small text-body-secondary">Sets a new password and signs this user out everywhere.</p>
            <label class="form-label" for="newPassword">New password</label>
            <input id="newPassword" type="password" class="form-control" formControlName="newPassword"
                   autocomplete="new-password" [class.is-invalid]="resetInvalid()" />
            <div class="form-text">{{ hint }}</div>
            <app-field-error [control]="resetForm.get('newPassword')" label="New password" [patternMessage]="patternMessage" />
          </div>
          <div class="card-footer bg-body d-flex justify-content-end">
            <button class="btn btn-outline-danger" type="submit" [disabled]="resetting()">
              @if (resetting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
              Reset password
            </button>
          </div>
        </form>
      }
    }
  `,
})
export class UserFormPage implements OnInit {
  readonly id = input<string>();

  private readonly api = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(USERNAME_PATTERN)]],
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    password: ['', PASSWORD_VALIDATORS],
    role: ['STAFF' as UserRole, Validators.required],
    active: [true],
  });
  readonly resetForm = this.fb.group({
    newPassword: ['', PASSWORD_VALIDATORS],
  });

  readonly hint = PASSWORD_HINT;
  readonly patternMessage = PASSWORD_PATTERN_MESSAGE;
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly resetting = signal(false);
  readonly formError = signal<string[]>([]);
  readonly isSelf = signal(false);

  ngOnInit() {
    const id = this.id();
    if (!id) return;
    this.form.controls.username.disable();
    this.form.controls.password.disable();
    this.loading.set(true);
    this.api.get(+id).subscribe({
      next: u => {
        this.form.patchValue(u);
        if (u.userId === this.auth.user()?.userId) {
          this.isSelf.set(true);
          this.form.controls.role.disable();
          this.form.controls.active.disable();
        }
        this.loading.set(false);
      },
      error: e => { this.loadError.set(toApiError(e).message); this.loading.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  resetInvalid() {
    const c = this.resetForm.controls.newPassword;
    return c.invalid && (c.touched || c.dirty);
  }

  save() {
    this.formError.set([]);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const id = this.id();
    this.saving.set(true);
    const request = id
      ? this.api.update(+id, { fullName: v.fullName.trim(), role: v.role, active: v.active })
      : this.api.create({ username: v.username.trim(), fullName: v.fullName.trim(), password: v.password, role: v.role, active: v.active });
    request.subscribe({
      next: u => {
        this.toast.success(`User ${u.username} ${id ? 'updated' : 'created'}`);
        if (u.userId === this.auth.user()?.userId) this.auth.refresh();
        this.router.navigate(['/users']);
      },
      error: e => {
        const err = toApiError(e);
        const rest = applyServerErrors(this.form, err);
        this.formError.set(rest.length || !Object.keys(err.fieldErrors).length ? [err.message, ...rest] : []);
        this.saving.set(false);
      },
    });
  }

  resetPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const id = +this.id()!;
    this.resetting.set(true);
    this.api.resetPassword(id, this.resetForm.getRawValue().newPassword).subscribe({
      next: () => {
        this.resetting.set(false);
        this.resetForm.reset();
        if (id === this.auth.user()?.userId) {
          this.toast.info('Your password was reset - please sign in with the new one');
          this.auth.logout();
        } else {
          this.toast.success('Password reset. Share the new password privately.');
        }
      },
      error: e => { this.toast.error(toApiError(e).message); this.resetting.set(false); },
    });
  }
}
