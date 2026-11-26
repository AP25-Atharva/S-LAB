import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { applyServerErrors, toApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/ui.services';
import { FieldError } from '../../shared/field-error';
import { PageHeader } from '../../shared/page-bits';

function matchNew(group: AbstractControl): ValidationErrors | null {
  const a = group.get('newPassword')?.value;
  const b = group.get('confirmPassword');
  if (!b) return null;
  if (b.value && a !== b.value) {
    b.setErrors({ ...(b.errors ?? {}), server: 'Passwords do not match' });
  } else if (b.errors?.['server'] === 'Passwords do not match') {
    const { server, ...rest } = b.errors;
    b.setErrors(Object.keys(rest).length ? rest : null);
  }
  return null;
}

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, RouterLink, FieldError, PageHeader],
  template: `
    <app-page-header title="Change password" subtitle="You stay signed in here; other devices are signed out" />
    <form class="card" style="max-width: 32rem" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="card-body">
        @if (formError()) { <div class="alert alert-danger" role="alert">{{ formError() }}</div> }
        <div class="mb-3">
          <label class="form-label" for="currentPassword">Current password<span class="req">*</span></label>
          <input id="currentPassword" type="password" class="form-control" formControlName="currentPassword"
                 autocomplete="current-password" [class.is-invalid]="invalid('currentPassword')" />
          <app-field-error [control]="form.get('currentPassword')" label="Current password" />
        </div>
        <div class="mb-3">
          <label class="form-label" for="newPassword">New password<span class="req">*</span></label>
          <input id="newPassword" type="password" class="form-control" formControlName="newPassword"
                 autocomplete="new-password" [class.is-invalid]="invalid('newPassword')" />
          <div class="form-text">At least 8 characters.</div>
          <app-field-error [control]="form.get('newPassword')" label="New password" />
        </div>
        <div>
          <label class="form-label" for="confirmPassword">Confirm new password<span class="req">*</span></label>
          <input id="confirmPassword" type="password" class="form-control" formControlName="confirmPassword"
                 autocomplete="new-password" [class.is-invalid]="invalid('confirmPassword')" />
          <app-field-error [control]="form.get('confirmPassword')" label="Confirmation" />
        </div>
      </div>
      <div class="card-footer bg-body d-flex justify-content-end gap-2">
        <a class="btn btn-outline-secondary" routerLink="/dashboard">Cancel</a>
        <button class="btn btn-primary" type="submit" [disabled]="saving()">
          @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
          Change password
        </button>
      </div>
    </form>
  `,
})
export class ChangePasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly form = inject(FormBuilder).nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required],
  }, { validators: matchNew });

  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  save() {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.auth.changePassword(v.currentPassword, v.newPassword).subscribe({
      next: () => {
        this.toast.success('Password changed');
        this.router.navigate(['/dashboard']);
      },
      error: e => {
        const err = toApiError(e);
        if (!applyServerErrors(this.form, err).length && Object.keys(err.fieldErrors).length) {
          this.formError.set(null);
        } else {
          this.formError.set(err.message);
        }
        this.saving.set(false);
      },
    });
  }
}
