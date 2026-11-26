import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BatchService, TrainerService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { Batch, Trainer } from '../../core/models';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { SeatBar } from '../../shared/seat-bar';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-trainer-detail',
  imports: [RouterLink, DatePipe, PageHeader, LoadState, StatusBadge, SeatBar],
  template: `
    <app-load-state [loading]="loading()" [error]="error()" />
    @if (trainer(); as t) {
      <app-page-header [title]="t.fullName" [subtitle]="t.trainerCode + (t.expertise ? ' · ' + t.expertise : '')"
                       backLink="/trainers" backLabel="Trainers">
        <a class="btn btn-outline-primary" [routerLink]="['/trainers', t.trainerId, 'edit']">
          <i class="bi bi-pencil me-1"></i>Edit</a>
        @if (t.active) {
          <a class="btn btn-primary" routerLink="/batches/new" [queryParams]="{ trainerId: t.trainerId }">
            <i class="bi bi-calendar-plus me-1"></i>Schedule batch</a>
        }
      </app-page-header>

      <div class="row g-3">
        <div class="col-12 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-body fw-semibold">Trainer details</div>
            <div class="card-body">
              <dl class="row detail mb-0">
                <dt class="col-5">Code</dt><dd class="col-7">{{ t.trainerCode }}</dd>
                <dt class="col-5">Email</dt><dd class="col-7 text-break"><a href="mailto:{{ t.email }}">{{ t.email }}</a></dd>
                <dt class="col-5">Phone</dt><dd class="col-7">{{ t.phone }}</dd>
                <dt class="col-5">Expertise</dt><dd class="col-7">{{ t.expertise || '—' }}</dd>
                <dt class="col-5">Active batches</dt><dd class="col-7">{{ t.activeBatchCount }}</dd>
                <dt class="col-5">Status</dt><dd class="col-7"><app-status-badge [status]="t.active" /></dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-8">
          <div class="card h-100">
            <div class="card-header bg-body fw-semibold">Assigned batches ({{ batches().length }})</div>
            @if (batches().length === 0) {
              <div class="card-body text-body-secondary">No batches assigned to this trainer yet.</div>
            } @else {
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead><tr><th>Batch</th><th>Course</th><th>Dates</th><th>Seats</th><th>Status</th></tr></thead>
                  <tbody>
                    @for (b of batches(); track b.batchId) {
                      <tr>
                        <td><a [routerLink]="['/batches', b.batchId]" class="fw-semibold">{{ b.batchCode }}</a></td>
                        <td>{{ b.courseTitle }}</td>
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
export class TrainerDetailPage implements OnInit {
  readonly id = input.required<string>();
  private readonly trainers = inject(TrainerService);
  private readonly batchApi = inject(BatchService);

  readonly trainer = signal<Trainer | null>(null);
  readonly batches = signal<Batch[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    const id = +this.id();
    forkJoin([this.trainers.get(id), this.batchApi.list({ trainerId: id })]).subscribe({
      next: ([t, b]) => { this.trainer.set(t); this.batches.set(b); this.loading.set(false); },
      error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
    });
  }
}
