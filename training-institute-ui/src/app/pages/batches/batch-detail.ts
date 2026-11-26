import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BatchService, EnrolmentService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { BatchStatus, BatchSummary, Enrolment, EnrolmentStatus } from '../../core/models';
import { ConfirmService, ToastService } from '../../core/ui.services';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { SeatBar } from '../../shared/seat-bar';
import { StatusBadge } from '../../shared/status-badge';

/** Batch summary: capacity, seat counts, status actions and the enrolment roster. */
@Component({
  selector: 'app-batch-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, PageHeader, LoadState, StatusBadge, SeatBar],
  template: `
    <app-load-state [loading]="loading()" [error]="error()" />
    @if (summary(); as s) {
      @let b = s.batch;
      <app-page-header [title]="'Batch ' + b.batchCode" [subtitle]="b.courseTitle + ' · ' + b.trainerName"
                       backLink="/batches" backLabel="Batches">
        @if (isOpen()) {
          <a class="btn btn-primary" routerLink="/enrolments/new" [queryParams]="{ batchId: b.batchId }">
            <i class="bi bi-person-plus me-1"></i>Enrol student</a>
        }
        <a class="btn btn-outline-primary" [routerLink]="['/batches', b.batchId, 'edit']">
          <i class="bi bi-pencil me-1"></i>Edit</a>
        @if (b.status === 'PLANNED') {
          <button class="btn btn-outline-success" (click)="changeStatus('RUNNING')">
            <i class="bi bi-play-fill me-1"></i>Start</button>
        }
        @if (b.status === 'RUNNING') {
          <button class="btn btn-outline-success" (click)="changeStatus('COMPLETED')">
            <i class="bi bi-flag-fill me-1"></i>Complete</button>
        }
        @if (isOpen()) {
          <button class="btn btn-outline-danger" (click)="changeStatus('CANCELLED')">
            <i class="bi bi-x-circle me-1"></i>Cancel batch</button>
        }
      </app-page-header>

      <!-- Capacity & status summary -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card h-100"><div class="card-body">
            <div class="small text-body-secondary">Status</div>
            <div class="mt-2"><app-status-badge [status]="b.status" /></div>
            <div class="small text-body-secondary mt-2">{{ b.mode.charAt(0) + b.mode.slice(1).toLowerCase() }}</div>
          </div></div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card h-100"><div class="card-body">
            <div class="small text-body-secondary">Seats taken</div>
            <div class="stat-value tabular fs-3">{{ b.seats.occupied }} / {{ b.capacity }}</div>
            <app-seat-bar [seats]="b.seats" />
          </div></div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card h-100"><div class="card-body">
            <div class="small text-body-secondary">Available seats</div>
            <div class="stat-value tabular fs-3" [class.text-danger]="b.seats.full">{{ b.seats.available }}</div>
            <div class="small text-body-secondary">
              @if (b.seats.full) { <span class="text-danger-emphasis fw-semibold">Batch is full</span> · }
              {{ b.seats.waitlisted }} waitlisted
            </div>
          </div></div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card h-100"><div class="card-body">
            <div class="small text-body-secondary">Average attendance</div>
            <div class="stat-value tabular fs-3">
              {{ s.averageAttendance === null ? '—' : (s.averageAttendance | number: '1.0-1') + '%' }}
            </div>
            <div class="small text-body-secondary">{{ b.startDate | date: 'dd MMM yyyy' }} – {{ b.endDate | date: 'dd MMM yyyy' }}</div>
          </div></div>
        </div>
      </div>

      <!-- Roster -->
      <div class="card">
        <div class="card-header bg-body d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span class="fw-semibold">Roster ({{ s.roster.length }})</span>
          <div class="small text-body-secondary">
            {{ b.seats.enrolled }} enrolled · {{ b.seats.completed }} completed ·
            {{ b.seats.waitlisted }} waitlisted · {{ b.seats.withdrawn }} withdrawn
          </div>
        </div>
        @if (s.roster.length === 0) {
          <div class="card-body text-body-secondary">No students enrolled in this batch yet.</div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr><th>Student</th><th>Enrolled on</th><th class="text-end">Attendance</th><th>Status</th>
                    <th>Remarks</th><th></th></tr>
              </thead>
              <tbody>
                @for (e of s.roster; track e.enrolmentId) {
                  <tr [class.text-body-secondary]="e.status === 'WITHDRAWN'">
                    <td>
                      <a [routerLink]="['/students', e.studentId]" class="fw-semibold">{{ e.studentName }}</a>
                      <div class="small text-body-secondary">{{ e.studentCode }} · {{ e.studentEmail }}</div>
                    </td>
                    <td class="small text-nowrap">{{ e.enrolmentDate | date: 'dd MMM yyyy' }}</td>
                    <td class="text-end tabular">
                      {{ e.attendancePercentage === null ? '—' : (e.attendancePercentage | number: '1.0-2') + '%' }}
                    </td>
                    <td><app-status-badge [status]="e.status" /></td>
                    <td class="small">{{ e.remarks || '' }}</td>
                    <td class="actions-cell">
                      @if (e.status === 'WAITLISTED' && !b.seats.full && isOpen()) {
                        <button class="btn btn-sm btn-outline-primary" (click)="setEnrolment(e, 'ENROLLED')" title="Move into a free seat">
                          <i class="bi bi-arrow-up-circle me-1"></i>Enrol</button>
                      }
                      @if (e.status === 'ENROLLED') {
                        <button class="btn btn-sm btn-outline-success ms-1" (click)="setEnrolment(e, 'COMPLETED')" title="Mark completed">
                          <i class="bi bi-check2-circle"></i></button>
                      }
                      <a class="btn btn-sm btn-outline-secondary ms-1" [routerLink]="['/enrolments', e.enrolmentId, 'edit']"
                         title="Edit attendance / remarks"><i class="bi bi-pencil"></i></a>
                      @if (e.status === 'ENROLLED' || e.status === 'WAITLISTED') {
                        <button class="btn btn-sm btn-outline-danger ms-1" (click)="setEnrolment(e, 'WITHDRAWN')" title="Withdraw">
                          <i class="bi bi-box-arrow-right"></i></button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `,
})
export class BatchDetailPage implements OnInit {
  readonly id = input.required<string>();

  private readonly api = inject(BatchService);
  private readonly enrolmentApi = inject(EnrolmentService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly summary = signal<BatchSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isOpen = computed(() => {
    const st = this.summary()?.batch.status;
    return st === 'PLANNED' || st === 'RUNNING';
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.summary(+this.id()).subscribe({
      next: s => { this.summary.set(s); this.error.set(null); this.loading.set(false); },
      error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
    });
  }

  async changeStatus(status: BatchStatus) {
    const b = this.summary()!.batch;
    const text: Record<BatchStatus, string> = {
      PLANNED: '',
      RUNNING: `Start batch ${b.batchCode}? Its status becomes Running.`,
      COMPLETED: `Mark batch ${b.batchCode} as completed? A completed batch cannot be reopened.`,
      CANCELLED: `Cancel batch ${b.batchCode}? All enrolled and waitlisted students will be withdrawn, and the batch cannot be reopened.`,
    };
    const ok = await this.confirm.ask({
      title: status === 'CANCELLED' ? 'Cancel batch' : status === 'COMPLETED' ? 'Complete batch' : 'Start batch',
      message: text[status],
      confirmText: status === 'CANCELLED' ? 'Cancel batch' : 'Confirm',
      danger: status === 'CANCELLED',
    });
    if (!ok) return;
    this.api.setStatus(b.batchId, status).subscribe({
      next: () => { this.toast.success(`Batch ${b.batchCode} is now ${status.toLowerCase()}`); this.load(); },
      error: e => this.toast.error(toApiError(e).message),
    });
  }

  async setEnrolment(e: Enrolment, status: EnrolmentStatus) {
    const verbs: Partial<Record<EnrolmentStatus, string>> = {
      ENROLLED: `Move ${e.studentName} from the waitlist into a seat?`,
      COMPLETED: `Mark ${e.studentName} as having completed this batch?`,
      WITHDRAWN: `Withdraw ${e.studentName} from ${e.batchCode}? Their seat will be freed.`,
    };
    const ok = await this.confirm.ask({
      title: status === 'WITHDRAWN' ? 'Withdraw student' : 'Update enrolment',
      message: verbs[status] ?? '',
      confirmText: status === 'WITHDRAWN' ? 'Withdraw' : 'Confirm',
      danger: status === 'WITHDRAWN',
    });
    if (!ok) return;
    this.enrolmentApi.setStatus(e.enrolmentId, status).subscribe({
      next: () => { this.toast.success(`${e.studentName}: ${status.toLowerCase()}`); this.load(); },
      error: err => this.toast.error(toApiError(err).message),
    });
  }
}
