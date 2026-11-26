import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { BatchService, EnrolmentService, StudentService } from '../../core/api.services';
import { applyServerErrors, toApiError } from '../../core/api-error';
import { ENROLMENT_STATUSES, Batch, Enrolment, EnrolmentRequest, EnrolmentStatus, Student } from '../../core/models';
import { ToastService } from '../../core/ui.services';
import { FieldError } from '../../shared/field-error';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { SeatBar } from '../../shared/seat-bar';

@Component({
  selector: 'app-enrolment-form',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, FieldError, PageHeader, LoadState, SeatBar],
  template: `
    <app-page-header [title]="id() ? 'Edit enrolment' : 'Enrol student'"
                     [subtitle]="id() ? 'Update status, attendance and remarks' : 'Place a student in a planned or running batch'"
                     [backLink]="backLink()" backLabel="Back" />
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
            <div class="col-12 col-md-6">
              <label class="form-label" for="studentId">Student<span class="req">*</span></label>
              <select id="studentId" class="form-select" formControlName="studentId" [class.is-invalid]="invalid('studentId')">
                <option [ngValue]="null" disabled>Select a student…</option>
                @for (s of studentOptions(); track s.studentId) {
                  <option [ngValue]="s.studentId">{{ s.fullName }} ({{ s.studentCode }})</option>
                }
              </select>
              <app-field-error [control]="form.get('studentId')" label="Student" />
              @if (id()) { <div class="form-text">Student cannot be changed on an existing enrolment.</div> }
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label" for="batchId">Batch<span class="req">*</span></label>
              <select id="batchId" class="form-select" formControlName="batchId" [class.is-invalid]="invalid('batchId')">
                <option [ngValue]="null" disabled>Select a batch…</option>
                @for (b of batchOptions(); track b.batchId) {
                  <option [ngValue]="b.batchId">
                    {{ b.batchCode }} – {{ b.courseTitle }} ({{ b.seats.full ? 'FULL' : b.seats.available + ' seats left' }})
                  </option>
                }
              </select>
              <app-field-error [control]="form.get('batchId')" label="Batch" />
            </div>

            @if (selectedBatch(); as b) {
              <div class="col-12">
                <div class="border rounded p-3 bg-body-tertiary">
                  <div class="row g-2 align-items-center">
                    <div class="col-12 col-md-5">
                      <div class="fw-semibold">{{ b.batchCode }} · {{ b.courseTitle }}</div>
                      <div class="small text-body-secondary">
                        {{ b.trainerName }} · {{ b.startDate | date: 'dd MMM yyyy' }} – {{ b.endDate | date: 'dd MMM yyyy' }}
                      </div>
                    </div>
                    <div class="col-12 col-md-4"><app-seat-bar [seats]="b.seats" /></div>
                    <div class="col-12 col-md-3 small">
                      @if (b.seats.full) {
                        <span class="text-danger-emphasis fw-semibold"><i class="bi bi-exclamation-circle me-1"></i>Batch is full</span>
                      } @else {
                        <span class="text-success-emphasis">{{ b.seats.available }} of {{ b.capacity }} seats free</span>
                      }
                    </div>
                  </div>
                  @if (seatWarning()) {
                    <div class="alert alert-warning mt-3 mb-0 py-2 small d-flex justify-content-between align-items-center gap-2">
                      <span>This batch is full, so the student can only be waitlisted.</span>
                      <button type="button" class="btn btn-sm btn-warning" (click)="form.controls.status.setValue('WAITLISTED')">
                        Waitlist instead</button>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="col-12 col-md-4">
              <label class="form-label" for="status">Status<span class="req">*</span></label>
              <select id="status" class="form-select" formControlName="status">
                @for (s of statusOptions(); track s) { <option [value]="s">{{ s.charAt(0) + s.slice(1).toLowerCase() }}</option> }
              </select>
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label" for="attendancePercentage">Attendance (%)</label>
              <input id="attendancePercentage" type="number" step="0.01" class="form-control"
                     formControlName="attendancePercentage" [class.is-invalid]="invalid('attendancePercentage')" />
              <app-field-error [control]="form.get('attendancePercentage')" label="Attendance" />
            </div>
            <div class="col-12">
              <label class="form-label" for="remarks">Remarks</label>
              <input id="remarks" class="form-control" formControlName="remarks" [class.is-invalid]="invalid('remarks')" />
              <app-field-error [control]="form.get('remarks')" label="Remarks" />
            </div>
          </div>
        </div>
        <div class="card-footer bg-body d-flex justify-content-end gap-2">
          <a class="btn btn-outline-secondary" [routerLink]="backLink()">Cancel</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
            {{ id() ? 'Save changes' : 'Enrol student' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class EnrolmentFormPage implements OnInit {
  readonly id = input<string>();

  private readonly api = inject(EnrolmentService);
  private readonly studentApi = inject(StudentService);
  private readonly batchApi = inject(BatchService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly form = inject(FormBuilder).group({
    studentId: [null as number | null, Validators.required],
    batchId: [null as number | null, Validators.required],
    status: ['ENROLLED' as EnrolmentStatus, Validators.required],
    attendancePercentage: [0 as number | null, [Validators.min(0), Validators.max(100)]],
    remarks: ['', Validators.maxLength(255)],
  });

  readonly students = signal<Student[]>([]);
  readonly batches = signal<Batch[]>([]);
  readonly original = signal<Enrolment | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string[]>([]);

  private readonly batchIdValue = toSignal(this.form.controls.batchId.valueChanges, { initialValue: null });
  private readonly statusValue = toSignal(this.form.controls.status.valueChanges, { initialValue: 'ENROLLED' });

  readonly backLink = computed(() => {
    const fromBatch = this.route.snapshot.queryParamMap.get('batchId');
    if (this.original()) return `/batches/${this.original()!.batchId}`;
    return fromBatch ? `/batches/${fromBatch}` : '/enrolments';
  });

  /** Only active students can enrol (the current student is kept when editing). */
  readonly studentOptions = computed(() =>
    this.students().filter(s => s.status === 'ACTIVE' || s.studentId === this.original()?.studentId));

  /** Only PLANNED / RUNNING batches accept enrolments (the current batch is kept when editing). */
  readonly batchOptions = computed(() =>
    this.batches().filter(b => b.status === 'PLANNED' || b.status === 'RUNNING' || b.batchId === this.original()?.batchId));

  readonly selectedBatch = computed(() => this.batches().find(b => b.batchId === this.batchIdValue()) ?? null);

  readonly statusOptions = computed<EnrolmentStatus[]>(() =>
    this.original() ? ENROLMENT_STATUSES : ['ENROLLED', 'WAITLISTED']);

  /** Warn before the API rejects an ENROLLED request into a full batch. */
  readonly seatWarning = computed(() => {
    const b = this.selectedBatch();
    if (!b || !b.seats.full || this.statusValue() !== 'ENROLLED') return false;
    const o = this.original();
    const alreadyHoldsSeat = !!o && o.batchId === b.batchId && (o.status === 'ENROLLED' || o.status === 'COMPLETED');
    return !alreadyHoldsSeat;
  });

  ngOnInit() {
    const id = this.id();
    forkJoin({
      students: this.studentApi.list(),
      batches: this.batchApi.list(),
      enrolment: id ? this.api.get(+id) : of(null),
    }).subscribe({
      next: ({ students, batches, enrolment }) => {
        this.students.set(students);
        this.batches.set(batches);
        if (enrolment) {
          this.original.set(enrolment);
          this.form.patchValue({ ...enrolment, remarks: enrolment.remarks ?? '' });
          this.form.controls.studentId.disable();
        } else {
          const q = this.route.snapshot.queryParamMap;
          if (q.get('batchId')) this.form.patchValue({ batchId: +q.get('batchId')! });
          if (q.get('studentId')) this.form.patchValue({ studentId: +q.get('studentId')! });
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
    const body: EnrolmentRequest = {
      studentId: v.studentId!,
      batchId: v.batchId!,
      status: v.status!,
      attendancePercentage: v.attendancePercentage ?? null,
      remarks: v.remarks?.trim() || null,
    };
    const id = this.id();
    this.saving.set(true);
    (id ? this.api.update(+id, body) : this.api.create(body)).subscribe({
      next: e => {
        this.toast.success(`${e.studentName} ${id ? 'updated' : e.status === 'WAITLISTED' ? 'waitlisted' : 'enrolled'} in ${e.batchCode}`);
        this.router.navigate(['/batches', e.batchId]);
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
