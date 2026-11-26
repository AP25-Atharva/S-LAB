import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, merge } from 'rxjs';
import { BatchService, EnrolmentService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { ENROLMENT_STATUSES, Batch, Enrolment } from '../../core/models';
import { ConfirmService, ToastService } from '../../core/ui.services';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-enrolment-list',
  imports: [RouterLink, ReactiveFormsModule, DatePipe, DecimalPipe, PageHeader, LoadState, StatusBadge],
  template: `
    <app-page-header title="Enrolments" subtitle="Students placed in batches">
      <a class="btn btn-primary" routerLink="/enrolments/new"><i class="bi bi-person-plus me-1"></i>Enrol student</a>
    </app-page-header>

    <div class="card">
      <div class="card-body border-bottom">
        <div class="row g-2">
          <div class="col-12 col-md-5">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input class="form-control" placeholder="Search by student, batch or course" [formControl]="search" />
            </div>
          </div>
          <div class="col-6 col-md-3">
            <select class="form-select" [formControl]="status" aria-label="Filter by status">
              <option value="">All statuses</option>
              @for (s of statuses; track s) { <option [value]="s">{{ s.charAt(0) + s.slice(1).toLowerCase() }}</option> }
            </select>
          </div>
          <div class="col-6 col-md-4">
            <select class="form-select" [formControl]="batchId" aria-label="Filter by batch">
              <option value="">All batches</option>
              @for (b of batches(); track b.batchId) { <option [value]="b.batchId">{{ b.batchCode }} – {{ b.courseTitle }}</option> }
            </select>
          </div>
        </div>
      </div>

      <app-load-state [loading]="loading()" [error]="error()" [empty]="!loading() && enrolments().length === 0"
                      emptyText="No enrolments match your filters." />

      @if (!loading() && enrolments().length > 0) {
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Student</th><th>Batch</th><th>Enrolled on</th><th class="text-end">Attendance</th>
                  <th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (e of enrolments(); track e.enrolmentId) {
                <tr>
                  <td>
                    <a [routerLink]="['/students', e.studentId]" class="fw-semibold">{{ e.studentName }}</a>
                    <div class="small text-body-secondary">{{ e.studentCode }}</div>
                  </td>
                  <td>
                    <a [routerLink]="['/batches', e.batchId]">{{ e.batchCode }}</a>
                    <div class="small text-body-secondary">{{ e.courseTitle }}</div>
                  </td>
                  <td class="small text-nowrap">{{ e.enrolmentDate | date: 'dd MMM yyyy' }}</td>
                  <td class="text-end tabular">
                    {{ e.attendancePercentage === null ? '—' : (e.attendancePercentage | number: '1.0-2') + '%' }}
                  </td>
                  <td><app-status-badge [status]="e.status" /></td>
                  <td class="actions-cell">
                    <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/enrolments', e.enrolmentId, 'edit']" title="Edit">
                      <i class="bi bi-pencil"></i></a>
                    @if (e.status === 'ENROLLED' || e.status === 'WAITLISTED') {
                      <button class="btn btn-sm btn-outline-warning ms-1" (click)="withdraw(e)" title="Withdraw">
                        <i class="bi bi-box-arrow-right"></i></button>
                    }
                    @if (e.status === 'WITHDRAWN' || e.status === 'WAITLISTED') {
                      <button class="btn btn-sm btn-outline-danger ms-1" (click)="remove(e)" title="Delete">
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
export class EnrolmentListPage implements OnInit {
  private readonly api = inject(EnrolmentService);
  private readonly batchApi = inject(BatchService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = ENROLMENT_STATUSES;
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly batchId = new FormControl('', { nonNullable: true });
  readonly batches = signal<Batch[]>([]);
  readonly enrolments = signal<Enrolment[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.batchApi.list().subscribe(b => this.batches.set(b));
    merge(this.search.valueChanges.pipe(debounceTime(300)), this.status.valueChanges, this.batchId.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.list({ search: this.search.value.trim(), status: this.status.value, batchId: this.batchId.value })
      .subscribe({
        next: list => { this.enrolments.set(list); this.error.set(null); this.loading.set(false); },
        error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
      });
  }

  async withdraw(e: Enrolment) {
    const ok = await this.confirm.ask({
      title: 'Withdraw student',
      message: `Withdraw ${e.studentName} from ${e.batchCode}? Their seat will be freed for other students.`,
      confirmText: 'Withdraw',
      danger: true,
    });
    if (!ok) return;
    this.api.setStatus(e.enrolmentId, 'WITHDRAWN').subscribe({
      next: () => { this.toast.success(`${e.studentName} withdrawn from ${e.batchCode}`); this.load(); },
      error: err => this.toast.error(toApiError(err).message),
    });
  }

  async remove(e: Enrolment) {
    const ok = await this.confirm.ask({
      title: 'Delete enrolment',
      message: `Permanently delete the ${e.status.toLowerCase()} enrolment of ${e.studentName} in ${e.batchCode}?`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.delete(e.enrolmentId).subscribe({
      next: () => { this.toast.success('Enrolment deleted'); this.load(); },
      error: err => this.toast.error(toApiError(err).message),
    });
  }
}
