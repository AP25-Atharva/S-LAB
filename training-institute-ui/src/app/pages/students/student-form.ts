import { Component, OnInit, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StudentService } from '../../core/api.services';
import { applyServerErrors, toApiError, today } from '../../core/api-error';
import { STUDENT_STATUSES, StudentRequest, StudentStatus } from '../../core/models';
import { ToastService } from '../../core/ui.services';
import { FieldError } from '../../shared/field-error';
import { LoadState, PageHeader } from '../../shared/page-bits';

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;
const PHONE_PATTERN = /^\+?[0-9]{10,14}$/;

function notInFuture(control: AbstractControl): ValidationErrors | null {
  return control.value && control.value > today() ? { futureDate: true } : null;
}

@Component({
  selector: 'app-student-form',
  imports: [ReactiveFormsModule, RouterLink, FieldError, PageHeader, LoadState],
  template: `
    <app-page-header [title]="id() ? 'Edit student' : 'Add student'" backLink="/students" backLabel="Students" />
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
              <label class="form-label" for="studentCode">Student code<span class="req">*</span></label>
              <input id="studentCode" class="form-control" formControlName="studentCode" placeholder="e.g. ST-013"
                     [class.is-invalid]="invalid('studentCode')" />
              <app-field-error [control]="form.get('studentCode')" label="Student code"
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
            <div class="col-12 col-md-6">
              <label class="form-label" for="qualification">Qualification</label>
              <input id="qualification" class="form-control" formControlName="qualification" placeholder="e.g. B.Sc Computer Science"
                     [class.is-invalid]="invalid('qualification')" />
              <app-field-error [control]="form.get('qualification')" label="Qualification" />
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label" for="registrationDate">Registration date<span class="req">*</span></label>
              <input id="registrationDate" type="date" class="form-control" formControlName="registrationDate"
                     [max]="maxDate" [class.is-invalid]="invalid('registrationDate')" />
              <app-field-error [control]="form.get('registrationDate')" label="Registration date" />
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label" for="status">Status</label>
              <select id="status" class="form-select" formControlName="status">
                @for (s of statuses; track s) { <option [value]="s">{{ s.charAt(0) + s.slice(1).toLowerCase() }}</option> }
              </select>
            </div>
          </div>
        </div>
        <div class="card-footer bg-body d-flex justify-content-end gap-2">
          <a class="btn btn-outline-secondary" routerLink="/students">Cancel</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
            {{ id() ? 'Save changes' : 'Create student' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class StudentFormPage implements OnInit {
  readonly id = input<string>();

  private readonly api = inject(StudentService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly statuses = STUDENT_STATUSES;
  readonly maxDate = today();

  readonly form = inject(FormBuilder).nonNullable.group({
    studentCode: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(CODE_PATTERN)]],
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    qualification: ['', [Validators.maxLength(100)]],
    registrationDate: [today(), [Validators.required, notInFuture]],
    status: ['ACTIVE' as StudentStatus],
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
      next: s => { this.form.patchValue({ ...s, qualification: s.qualification ?? '' }); this.loading.set(false); },
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
    const body: StudentRequest = {
      studentCode: v.studentCode.trim(),
      fullName: v.fullName.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      qualification: v.qualification.trim() || null,
      registrationDate: v.registrationDate,
      status: v.status,
    };
    const id = this.id();
    this.saving.set(true);
    (id ? this.api.update(+id, body) : this.api.create(body)).subscribe({
      next: s => {
        this.toast.success(`Student ${s.fullName} ${id ? 'updated' : 'created'}`);
        this.router.navigate(['/students', s.studentId]);
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
