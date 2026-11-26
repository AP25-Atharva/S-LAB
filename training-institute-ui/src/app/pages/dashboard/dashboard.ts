import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { Batch, Dashboard } from '../../core/models';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { SeatBar } from '../../shared/seat-bar';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, PageHeader, LoadState, SeatBar, StatusBadge],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(DashboardService);

  readonly data = signal<Dashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.api.get().subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
    });
  }

  stats(d: Dashboard) {
    return [
      { label: 'Active courses', value: d.activeCourses, sub: `of ${d.totalCourses} total`, icon: 'bi-journal-bookmark', tone: 'primary', link: '/courses' },
      { label: 'Running batches', value: d.runningBatches, sub: `${d.plannedBatches} planned`, icon: 'bi-play-circle', tone: 'success', link: '/batches' },
      { label: 'Enrolled students', value: d.enrolledCount, sub: `${d.waitlistedCount} waitlisted`, icon: 'bi-person-check', tone: 'info', link: '/enrolments' },
      { label: 'Active trainers', value: d.activeTrainers, sub: `${d.activeStudents} active students`, icon: 'bi-person-badge', tone: 'warning', link: '/trainers' },
    ];
  }

  enrolmentBreakdown(d: Dashboard) {
    const rows = [
      { label: 'Enrolled', value: d.enrolledCount, color: 'primary' },
      { label: 'Waitlisted', value: d.waitlistedCount, color: 'warning' },
      { label: 'Completed', value: d.completedCount, color: 'success' },
      { label: 'Withdrawn', value: d.withdrawnCount, color: 'secondary' },
    ];
    const total = rows.reduce((s, r) => s + r.value, 0) || 1;
    return rows.map(r => ({ ...r, percent: Math.round((r.value / total) * 100) }));
  }

  batchBreakdown(d: Dashboard) {
    return [
      { label: 'Planned', value: d.plannedBatches, status: 'PLANNED' },
      { label: 'Running', value: d.runningBatches, status: 'RUNNING' },
      { label: 'Completed', value: d.completedBatches, status: 'COMPLETED' },
      { label: 'Cancelled', value: d.cancelledBatches, status: 'CANCELLED' },
    ];
  }

  trackBatch = (_: number, b: Batch) => b.batchId;
}
