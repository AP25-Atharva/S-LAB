import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, merge } from 'rxjs';
import { BatchService, CourseService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { BATCH_STATUSES, Batch, Course } from '../../core/models';
import { AuthService } from '../../core/auth.service';
import { ConfirmService, ToastService } from '../../core/ui.services';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { SeatBar } from '../../shared/seat-bar';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-batch-list',
  imports: [RouterLink, ReactiveFormsModule, DatePipe, PageHeader, LoadState, StatusBadge, SeatBar],
  template: `
    <app-page-header title="Batches" subtitle="Scheduled runs of each course">
      <a class="btn btn-primary" routerLink="/batches/new"><i class="bi bi-calendar-plus me-1"></i>Schedule batch</a>
    </app-page-header>

    <div class="card">
      <div class="card-body border-bottom">
        <div class="row g-2">
          <div class="col-12 col-md-5">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input class="form-control" placeholder="Search by batch code, course or trainer" [formControl]="search" />
            </div>
          </div>
          <div class="col-6 col-md-3">
            <select class="form-select" [formControl]="status" aria-label="Filter by status">
              <option value="">All statuses</option>
              @for (s of statuses; track s) { <option [value]="s">{{ s.charAt(0) + s.slice(1).toLowerCase() }}</option> }
            </select>
          </div>
          <div class="col-6 col-md-4">
            <select class="form-select" [formControl]="courseId" aria-label="Filter by course">
              <option value="">All courses</option>
              @for (c of courses(); track c.courseId) { <option [value]="c.courseId">{{ c.courseCode }} – {{ c.title }}</option> }
            </select>
          </div>
        </div>
      </div>

      <app-load-state [loading]="loading()" [error]="error()" [empty]="!loading() && batches().length === 0"
                      emptyText="No batches match your filters." />

      @if (!loading() && batches().length > 0) {
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Batch</th><th>Course</th><th>Trainer</th><th>Dates</th><th>Mode</th>
                  <th>Seats</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (b of batches(); track b.batchId) {
                <tr>
                  <td><a [routerLink]="['/batches', b.batchId]" class="fw-semibold">{{ b.batchCode }}</a></td>
                  <td>{{ b.courseTitle }}<div class="small text-body-secondary">{{ b.courseCode }}</div></td>
                  <td>{{ b.trainerName }}</td>
                  <td class="small text-nowrap">{{ b.startDate | date: 'dd MMM yy' }} –<br />{{ b.endDate | date: 'dd MMM yy' }}</td>
                  <td class="small">{{ b.mode.charAt(0) + b.mode.slice(1).toLowerCase() }}</td>
                  <td><app-seat-bar [seats]="b.seats" /></td>
                  <td><app-status-badge [status]="b.status" /></td>
                  <td class="actions-cell">
                    <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/batches', b.batchId]" title="Summary & roster">
                      <i class="bi bi-eye"></i></a>
                    <a class="btn btn-sm btn-outline-secondary ms-1" [routerLink]="['/batches', b.batchId, 'edit']" title="Edit">
                      <i class="bi bi-pencil"></i></a>
                    @if (auth.isAdmin()) {
                      <button class="btn btn-sm btn-outline-danger ms-1" (click)="remove(b)" title="Delete">
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
export class BatchListPage implements OnInit {
  private readonly api = inject(BatchService);
  private readonly courseApi = inject(CourseService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = BATCH_STATUSES;
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = new FormControl(this.route.snapshot.queryParamMap.get('status') ?? '', { nonNullable: true });
  readonly courseId = new FormControl('', { nonNullable: true });
  readonly courses = signal<Course[]>([]);
  readonly batches = signal<Batch[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.courseApi.list().subscribe(c => this.courses.set(c));
    merge(this.search.valueChanges.pipe(debounceTime(300)), this.status.valueChanges, this.courseId.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.list({ search: this.search.value.trim(), status: this.status.value, courseId: this.courseId.value })
      .subscribe({
        next: list => { this.batches.set(list); this.error.set(null); this.loading.set(false); },
        error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
      });
  }

  async remove(b: Batch) {
    const ok = await this.confirm.ask({
      title: 'Delete batch',
      message: `Permanently delete batch ${b.batchCode}? Batches with enrolments cannot be deleted; cancel them instead.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.delete(b.batchId).subscribe({
      next: () => { this.toast.success(`Batch ${b.batchCode} deleted`); this.load(); },
      error: e => this.toast.error(toApiError(e).message),
    });
  }
}
