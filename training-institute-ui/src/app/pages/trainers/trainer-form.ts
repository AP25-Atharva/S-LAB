import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrainerService } from '../../core/api.services';
import { applyServerErrors, toApiError } from '../../core/api-error';
import { TrainerRequest } from '../../core/models';
import { ToastService } from '../../core/ui.services';
import { FieldError } from '../../shared/field-error';
import { LoadState, PageHeader } from '../../shared/page-bits';

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;
const PHONE_PATTERN = /^\+?[0-9]{10,14}$/;

@Component({
  selector: 'app-trainer-form',
  imports: [ReactiveFormsModule, RouterLink, FieldError, PageHeader, LoadState],
  template: `
    <app-page-header [title]="id() ? 'Edit trainer' : 'Add trainer'" backLink="/trainers" backLabel="Trainers" />
    <app-load-state [loading]="loading()" [error]="loadError()" />

    @if (!loading() && !loadError()) {
      <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="card-body">
          @if (formError().length) {
            <div class="alert alert-danger" role="alert">
              @for (m of formError(); track m) { <div>{{ m }}</div> }
            </div>
          }
          <div class="row g-3">
            <div class="col-12 col-md-4">
              <label class="form-label" for="trainerCode">Trainer code<span class="req">*</span></label>
              <input id="trainerCode" class="form-control" formControlName="trainerCode" placeholder="e.g. TR-006"
                     [class.is-invalid]="invalid('trainerCode')" />
              <app-field-error [control]="form.get('trainerCode')" label="Trainer code"
                               patternMessage="Use only letters, digits, '-' and '_'" />
            </div>
            <div class="col-12 col-md-8">
              <label class="form-label" for="fullName">Full name<span class="req">*</span></label>
              <input id="fullName" class="form-control" formControlName="fullName" [class.is-invalid]="invalid('fullName')" />
              <app-field-error [control]="form.get('fullName')" label="Full name" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label" for="email">Email<span class="req">*</span></label>
              <input id="email" type="email" class="form-control" formControlName="email" [class.is-invalid]="invalid('email')" />
              <app-field-error [control]="form.get('email')" label="Email" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label" for="phone">Phone<span class="req">*</span></label>
              <input id="phone" class="form-control" formControlName="phone" placeholder="10–14 digits"
                     [class.is-invalid]="invalid('phone')" />
              <app-field-error [control]="form.get('phone')" label="Phone"
                               patternMessage="Phone must be 10–14 digits, optionally starting with +" />
            </div>
            <div class="col-12">
              <label class="form-label" for="expertise">Expertise</label>
              <input id="expertise" class="form-control" formControlName="expertise" placeholder="e.g. Java, Spring Boot"
                     [class.is-invalid]="invalid('expertise')" />
              <app-field-error [control]="form.get('expertise')" label="Expertise" />
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input id="active" type="checkbox" class="form-check-input" formControlName="active" />
                <label class="form-check-label" for="active">Active (can be assigned to batches)</label>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer bg-body d-flex justify-content-end gap-2">
          <a class="btn btn-outline-secondary" routerLink="/trainers">Cancel</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
            {{ id() ? 'Save changes' : 'Create trainer' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class TrainerFormPage implements OnInit {
  readonly id = input<string>();

  private readonly api = inject(TrainerService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly form = inject(FormBuilder).nonNullable.group({
    trainerCode: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(CODE_PATTERN)]],
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    expertise: ['', [Validators.maxLength(150)]],
    active: [true],
  });

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string[]>([]);

  ngOnInit() {
    const id = this.id();
    if (!id) return;
    this.loading.set(true);
    this.api.get(+id).subscribe({
      next: t => { this.form.patchValue({ ...t, expertise: t.expertise ?? '' }); this.loading.set(false); },
      error: e => { this.loadError.set(toApiError(e).message); this.loading.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  save() {
    this.formError.set([]);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: TrainerRequest = {
      trainerCode: v.trainerCode.trim(),
      fullName: v.fullName.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      expertise: v.expertise.trim() || null,
      active: v.active,
    };
    const id = this.id();
    this.saving.set(true);
    (id ? this.api.update(+id, body) : this.api.create(body)).subscribe({
      next: t => {
        this.toast.success(`Trainer ${t.fullName} ${id ? 'updated' : 'created'}`);
        this.router.navigate(['/trainers', t.trainerId]);
      },
      error: e => {
        const err = toApiError(e);
        const rest = applyServerErrors(this.form, err);
        this.formError.set(rest.length || !Object.keys(err.fieldErrors).length ? [err.message, ...rest] : []);
        this.saving.set(false);
      },
    });
  }
}
