import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { BatchService, CourseService, TrainerService } from '../../core/api.services';
import { applyServerErrors, toApiError, today } from '../../core/api-error';
import { BATCH_MODES, BATCH_STATUSES, Batch, BatchMode, BatchRequest, BatchStatus, Course, Trainer } from '../../core/models';
import { ToastService } from '../../core/ui.services';
import { FieldError } from '../../shared/field-error';
import { LoadState, PageHeader } from '../../shared/page-bits';

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Group validator: end date must be on or after start date (error is put on endDate). */
function dateOrder(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')!;
  const end = group.get('endDate')!;
  const bad = !!start.value && !!end.value && end.value < start.value;
  const { dateOrder: _, ...others } = end.errors ?? {};
  end.setErrors(bad ? { ...others, dateOrder: true } : Object.keys(others).length ? others : null);
  return null;
}

@Component({
  selector: 'app-batch-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, FieldError, PageHeader, LoadState],
  template: `
    <app-page-header [title]="id() ? 'Edit batch' : 'Schedule batch'"
                     subtitle="Pick a course and a trainer, then set the dates and capacity"
                     [backLink]="id() ? '/batches/' + id() : '/batches'" [backLabel]="id() ? 'Batch' : 'Batches'" />
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
              <label class="form-label" for="batchCode">Batch code<span class="req">*</span></label>
              <input id="batchCode" class="form-control" formControlName="batchCode" placeholder="e.g. JAV-JAN27"
                     [class.is-invalid]="invalid('batchCode')" />
              <app-field-error [control]="form.get('batchCode')" label="Batch code"
                               patternMessage="Use only letters, digits, '-' and '_'" />
            </div>
            <div class="col-12 col-md-8">
              <label class="form-label" for="courseId">Course<span class="req">*</span></label>
              <select id="courseId" class="form-select" formControlName="courseId" [class.is-invalid]="invalid('courseId')">
                <option [ngValue]="null" disabled>Select a course…</option>
                @for (c of courseOptions(); track c.courseId) {
                  <option [ngValue]="c.courseId">{{ c.courseCode }} – {{ c.title }}{{ c.active ? '' : ' (inactive)' }}</option>
                }
              </select>
              <app-field-error [control]="form.get('courseId')" label="Course" />
              @if (selectedCourse(); as c) {
                <div class="form-text">{{ c.category }} · {{ c.durationHours }} hours · {{ c.fee | currency: 'INR' : 'symbol' : '1.0-2' }}</div>
              }
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label" for="trainerId">Trainer<span class="req">*</span></label>
              <select id="trainerId" class="form-select" formControlName="trainerId" [class.is-invalid]="invalid('trainerId')">
                <option [ngValue]="null" disabled>Select a trainer…</option>
                @for (t of trainerOptions(); track t.trainerId) {
                  <option [ngValue]="t.trainerId">{{ t.fullName }} ({{ t.trainerCode }}){{ t.active ? '' : ' – inactive' }}</option>
                }
              </select>
              <app-field-error [control]="form.get('trainerId')" label="Trainer" />
              @if (selectedTrainer(); as t) {
                <div class="form-text">{{ t.expertise || 'No expertise listed' }} · {{ t.activeBatchCount }} active batch(es)</div>
              }
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label" for="mode">Mode<span class="req">*</span></label>
              <select id="mode" class="form-select" formControlName="mode">
                @for (m of modes; track m) { <option [value]="m">{{ m.charAt(0) + m.slice(1).toLowerCase() }}</option> }
              </select>
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label" for="capacity">Capacity<span class="req">*</span></label>
              <input id="capacity" type="number" class="form-control" formControlName="capacity"
                     [class.is-invalid]="invalid('capacity')" />
              <app-field-error [control]="form.get('capacity')" label="Capacity" />
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label" for="startDate">Start date<span class="req">*</span></label>
              <input id="startDate" type="date" class="form-control" formControlName="startDate"
                     [class.is-invalid]="invalid('startDate')" />
              <app-field-error [control]="form.get('startDate')" label="Start date" />
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label" for="endDate">End date<span class="req">*</span></label>
              <input id="endDate" type="date" class="form-control" formControlName="endDate"
                     [min]="form.controls.startDate.value" [class.is-invalid]="invalid('endDate')" />
              <app-field-error [control]="form.get('endDate')" label="End date" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label" for="status">Status</label>
              <select id="status" class="form-select" formControlName="status">
                @for (s of statusOptions(); track s) { <option [value]="s">{{ s.charAt(0) + s.slice(1).toLowerCase() }}</option> }
              </select>
              @if (form.controls.status.value === 'CANCELLED' && original()?.status !== 'CANCELLED') {
                <div class="form-text text-danger-emphasis">Cancelling withdraws all enrolled and waitlisted students.</div>
              }
            </div>
          </div>
        </div>
        <div class="card-footer bg-body d-flex justify-content-end gap-2">
          <a class="btn btn-outline-secondary" [routerLink]="id() ? ['/batches', id()] : ['/batches']">Cancel</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
            {{ id() ? 'Save changes' : 'Schedule batch' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class BatchFormPage implements OnInit {
  readonly id = input<string>();

  private readonly api = inject(BatchService);
  private readonly courseApi = inject(CourseService);
  private readonly trainerApi = inject(TrainerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly modes = BATCH_MODES;
  readonly form = inject(FormBuilder).group({
    batchCode: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(CODE_PATTERN)]],
    courseId: [null as number | null, Validators.required],
    trainerId: [null as number | null, Validators.required],
    startDate: [today(), Validators.required],
    endDate: ['', Validators.required],
    mode: ['CLASSROOM' as BatchMode, Validators.required],
    capacity: [20 as number | null, [Validators.required, Validators.min(1), Validators.max(500)]],
    status: ['PLANNED' as BatchStatus],
  }, { validators: dateOrder });

  readonly courses = signal<Course[]>([]);
  readonly trainers = signal<Trainer[]>([]);
  readonly original = signal<Batch | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string[]>([]);

  private readonly courseIdValue = toSignal(this.form.controls.courseId.valueChanges, { initialValue: null });
  private readonly trainerIdValue = toSignal(this.form.controls.trainerId.valueChanges, { initialValue: null });

  /** Active courses, plus the batch's current course when editing (even if it was deactivated). */
  readonly courseOptions = computed(() =>
    this.courses().filter(c => c.active || c.courseId === this.original()?.courseId));
  readonly trainerOptions = computed(() =>
    this.trainers().filter(t => t.active || t.trainerId === this.original()?.trainerId));
  readonly selectedCourse = computed(() => this.courses().find(c => c.courseId === this.courseIdValue()) ?? null);
  readonly selectedTrainer = computed(() => this.trainers().find(t => t.trainerId === this.trainerIdValue()) ?? null);

  /** New batches start PLANNED or RUNNING; COMPLETED / CANCELLED batches cannot be reopened. */
  readonly statusOptions = computed<BatchStatus[]>(() => {
    const current = this.original()?.status;
    if (!current) return ['PLANNED', 'RUNNING'];
    if (current === 'COMPLETED' || current === 'CANCELLED') return [current];
    return BATCH_STATUSES;
  });

  ngOnInit() {
    const id = this.id();
    forkJoin({
      courses: this.courseApi.list(),
      trainers: this.trainerApi.list(),
      batch: id ? this.api.get(+id) : of(null),
    }).subscribe({
      next: ({ courses, trainers, batch }) => {
        this.courses.set(courses);
        this.trainers.set(trainers);
        if (batch) {
          this.original.set(batch);
          this.form.patchValue(batch);
        } else {
          const q = this.route.snapshot.queryParamMap;
          if (q.get('courseId')) this.form.patchValue({ courseId: +q.get('courseId')! });
          if (q.get('trainerId')) this.form.patchValue({ trainerId: +q.get('trainerId')! });
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

  save() {
    this.formError.set([]);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: BatchRequest = {
      batchCode: v.batchCode!.trim(),
      courseId: v.courseId!,
      trainerId: v.trainerId!,
      startDate: v.startDate!,
      endDate: v.endDate!,
      mode: v.mode!,
      capacity: v.capacity!,
      status: v.status!,
    };
    const id = this.id();
    this.saving.set(true);
    (id ? this.api.update(+id, body) : this.api.create(body)).subscribe({
      next: b => {
        this.toast.success(`Batch ${b.batchCode} ${id ? 'updated' : 'scheduled'}`);
        this.router.navigate(['/batches', b.batchId]);
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
