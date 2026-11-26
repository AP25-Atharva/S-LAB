import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BatchService, CourseService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { Batch, Course } from '../../core/models';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { SeatBar } from '../../shared/seat-bar';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, PageHeader, LoadState, StatusBadge, SeatBar],
  template: `
    <app-load-state [loading]="loading()" [error]="error()" />
    @if (course(); as c) {
      <app-page-header [title]="c.title" [subtitle]="c.courseCode + ' · ' + c.category"
                       backLink="/courses" backLabel="Courses">
        <a class="btn btn-outline-primary" [routerLink]="['/courses', c.courseId, 'edit']">
          <i class="bi bi-pencil me-1"></i>Edit</a>
        @if (c.active) {
          <a class="btn btn-primary" routerLink="/batches/new" [queryParams]="{ courseId: c.courseId }">
            <i class="bi bi-calendar-plus me-1"></i>Schedule batch</a>
        }
      </app-page-header>

      <div class="row g-3">
        <div class="col-12 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-body fw-semibold">Course details</div>
            <div class="card-body">
              <dl class="row detail mb-0">
                <dt class="col-5">Code</dt><dd class="col-7">{{ c.courseCode }}</dd>
                <dt class="col-5">Category</dt><dd class="col-7">{{ c.category }}</dd>
                <dt class="col-5">Duration</dt><dd class="col-7">{{ c.durationHours }} hours</dd>
                <dt class="col-5">Fee</dt><dd class="col-7">{{ c.fee | currency: 'INR' : 'symbol' : '1.0-2' }}</dd>
                <dt class="col-5">Status</dt><dd class="col-7"><app-status-badge [status]="c.active" /></dd>
              </dl>
              @if (c.description) {
                <hr /><p class="mb-0">{{ c.description }}</p>
              }
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-8">
          <div class="card h-100">
            <div class="card-header bg-body fw-semibold">Batches ({{ batches().length }})</div>
            @if (batches().length === 0) {
              <div class="card-body text-body-secondary">No batches scheduled for this course yet.</div>
            } @else {
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead><tr><th>Batch</th><th>Trainer</th><th>Dates</th><th>Seats</th><th>Status</th></tr></thead>
                  <tbody>
                    @for (b of batches(); track b.batchId) {
                      <tr>
                        <td><a [routerLink]="['/batches', b.batchId]" class="fw-semibold">{{ b.batchCode }}</a></td>
                        <td>{{ b.trainerName }}</td>
                        <td class="small text-nowrap">{{ b.startDate | date: 'dd MMM yy' }} – {{ b.endDate | date: 'dd MMM yy' }}</td>
                        <td><app-seat-bar [seats]="b.seats" /></td>
                        <td><app-status-badge [status]="b.status" /></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class CourseDetailPage implements OnInit {
  readonly id = input.required<string>();
  private readonly courses = inject(CourseService);
  private readonly batchApi = inject(BatchService);

  readonly course = signal<Course | null>(null);
  readonly batches = signal<Batch[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    const id = +this.id();
    forkJoin([this.courses.get(id), this.batchApi.list({ courseId: id })]).subscribe({
      next: ([c, b]) => { this.course.set(c); this.batches.set(b); this.loading.set(false); },
      error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
    });
  }
}
