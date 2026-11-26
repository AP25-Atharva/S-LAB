import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { FieldError } from '../../shared/field-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FieldError],
  template: `
    <div class="login-wrap">
      <div class="card login-card">
        <div class="card-body p-4 p-sm-5">
          <div class="text-center mb-4">
            <div class="login-logo"><i class="bi bi-mortarboard-fill"></i></div>
            <h1 class="h4 mb-1">BatchWise</h1>
            <p class="text-body-secondary mb-0">Sign in to manage courses and batches</p>
          </div>

          @if (reason() === 'expired') {
            <div class="alert alert-warning small" role="status">Your session has ended. Please sign in again.</div>
          }
          @if (error()) {
            <div class="alert alert-danger small" role="alert">{{ error() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="mb-3">
              <label class="form-label" for="username">Username</label>
              <input id="username" class="form-control" formControlName="username" autocomplete="username"
                     autocapitalize="none" spellcheck="false" [class.is-invalid]="invalid('username')" />
              <app-field-error [control]="form.get('username')" label="Username" />
            </div>
            <div class="mb-4">
              <label class="form-label" for="password">Password</label>
              <div class="input-group has-validation">
                <input id="password" class="form-control" formControlName="password" autocomplete="current-password"
                       [type]="showPassword() ? 'text' : 'password'" [class.is-invalid]="invalid('password')" />
                <button class="btn btn-outline-secondary" type="button" (click)="showPassword.set(!showPassword())"
                        [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                  <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
                </button>
              </div>
              <app-field-error [control]="form.get('password')" label="Password" />
            </div>
            <button class="btn btn-primary w-100" type="submit" [disabled]="busy()">
              @if (busy()) { <span class="spinner-border spinner-border-sm me-1"></span> Signing in… }
              @else { Sign in }
            </button>
          </form>
          <p class="text-body-secondary small text-center mt-4 mb-0">
            No account? Ask your BatchWise admin to create one.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  readonly returnUrl = input<string>();
  readonly reason = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  submit() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.busy.set(true);
    this.auth.login(username.trim(), password).subscribe({
      next: () => {
        const target = this.returnUrl();
        // only follow in-app paths, never an external URL
        this.router.navigateByUrl(target && target.startsWith('/') && !target.startsWith('//') ? target : '/dashboard');
      },
      error: e => {
        const err = toApiError(e);
        this.error.set(err.status === 0
          ? 'Cannot reach the server. If the site was idle it may take up to a minute to wake up - try again.'
          : err.message);
        this.form.controls.password.reset();
        this.busy.set(false);
      },
    });
  }
}
