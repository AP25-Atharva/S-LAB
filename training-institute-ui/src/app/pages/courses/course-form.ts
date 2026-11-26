import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../../core/api.services';
import { applyServerErrors, toApiError } from '../../core/api-error';
import { CourseRequest } from '../../core/models';
import { ToastService } from '../../core/ui.services';
import { FieldError } from '../../shared/field-error';
import { LoadState, PageHeader } from '../../shared/page-bits';

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

@Component({
  selector: 'app-course-form',
  imports: [ReactiveFormsModule, RouterLink, FieldError, PageHeader, LoadState],
  template: `
    <app-page-header [title]="id() ? 'Edit course' : 'Add course'" backLink="/courses" backLabel="Courses" />
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
              <label class="form-label" for="courseCode">Course code<span class="req">*</span></label>
              <input id="courseCode" class="form-control" formControlName="courseCode" placeholder="e.g. JAV-101"
                     [class.is-invalid]="invalid('courseCode')" />
              <app-field-error [control]="form.get('courseCode')" label="Course code"
                               patternMessage="Use only letters, digits, '-' and '_'" />
            </div>
            <div class="col-12 col-md-8">
              <label class="form-label" for="title">Title<span class="req">*</span></label>
              <input id="title" class="form-control" formControlName="title" [class.is-invalid]="invalid('title')" />
              <app-field-error [control]="form.get('title')" label="Title" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label" for="category">Category<span class="req">*</span></label>
              <input id="category" class="form-control" formControlName="category" placeholder="e.g. Programming"
                     [class.is-invalid]="invalid('category')" />
              <app-field-error [control]="form.get('category')" label="Category" />
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label" for="durationHours">Duration (hours)<span class="req">*</span></label>
              <input id="durationHours" type="number" class="form-control" formControlName="durationHours"
                     [class.is-invalid]="invalid('durationHours')" />
              <app-field-error [control]="form.get('durationHours')" label="Duration" />
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label" for="fee">Fee (₹)<span class="req">*</span></label>
              <input id="fee" type="number" step="0.01" class="form-control" formControlName="fee"
                     [class.is-invalid]="invalid('fee')" />
              <app-field-error [control]="form.get('fee')" label="Fee" />
            </div>
            <div class="col-12">
              <label class="form-label" for="description">Description</label>
              <textarea id="description" rows="3" class="form-control" formControlName="description"
                        [class.is-invalid]="invalid('description')"></textarea>
              <app-field-error [control]="form.get('description')" label="Description" />
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input id="active" type="checkbox" class="form-check-input" formControlName="active" />
                <label class="form-check-label" for="active">Active (open for new batches)</label>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer bg-body d-flex justify-content-end gap-2">
          <a class="btn btn-outline-secondary" routerLink="/courses">Cancel</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
            {{ id() ? 'Save changes' : 'Create course' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class CourseFormPage implements OnInit {
  /** Route param :id (bound by withComponentInputBinding); absent when creating. */
  readonly id = input<string>();

  private readonly api = inject(CourseService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly form = inject(FormBuilder).nonNullable.group({
    courseCode: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(CODE_PATTERN)]],
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    category: ['', [Validators.required, Validators.maxLength(80)]],
    durationHours: [null as number | null, [Validators.required, Validators.min(1), Validators.max(2000)]],
    fee: [null as number | null, [Validators.required, Validators.min(0), Validators.max(99999999.99)]],
    description: ['', [Validators.maxLength(2000)]],
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
      next: c => { this.form.patchValue({ ...c, description: c.description ?? '' }); this.loading.set(false); },
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
    const body: CourseRequest = {
      ...v,
      courseCode: v.courseCode.trim(),
      title: v.title.trim(),
      category: v.category.trim(),
      durationHours: v.durationHours!,
      fee: v.fee!,
      description: v.description.trim() || null,
    };
    const id = this.id();
    this.saving.set(true);
    (id ? this.api.update(+id, body) : this.api.create(body)).subscribe({
      next: c => {
        this.toast.success(`Course ${c.courseCode} ${id ? 'updated' : 'created'}`);
        this.router.navigate(['/courses', c.courseId]);
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
