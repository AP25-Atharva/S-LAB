import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EnrolmentService, StudentService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { Enrolment, Student } from '../../core/models';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-student-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, PageHeader, LoadState, StatusBadge],
  template: `
    <app-load-state [loading]="loading()" [error]="error()" />
    @if (student(); as s) {
      <app-page-header [title]="s.fullName" [subtitle]="s.studentCode" backLink="/students" backLabel="Students">
        <a class="btn btn-outline-primary" [routerLink]="['/students', s.studentId, 'edit']">
          <i class="bi bi-pencil me-1"></i>Edit</a>
        @if (s.status === 'ACTIVE') {
          <a class="btn btn-primary" routerLink="/enrolments/new" [queryParams]="{ studentId: s.studentId }">
            <i class="bi bi-person-plus me-1"></i>Enrol in batch</a>
        }
      </app-page-header>

      <div class="row g-3">
        <div class="col-12 col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-body fw-semibold">Student details</div>
            <div class="card-body">
              <dl class="row detail mb-0">
                <dt class="col-5">Code</dt><dd class="col-7">{{ s.studentCode }}</dd>
                <dt class="col-5">Email</dt><dd class="col-7 text-break"><a href="mailto:{{ s.email }}">{{ s.email }}</a></dd>
                <dt class="col-5">Phone</dt><dd class="col-7">{{ s.phone }}</dd>
                <dt class="col-5">Qualification</dt><dd class="col-7">{{ s.qualification || '—' }}</dd>
                <dt class="col-5">Registered</dt><dd class="col-7">{{ s.registrationDate | date: 'dd MMM yyyy' }}</dd>
                <dt class="col-5">Status</dt><dd class="col-7"><app-status-badge [status]="s.status" /></dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-8">
          <div class="card h-100">
            <div class="card-header bg-body fw-semibold">Enrolments ({{ enrolments().length }})</div>
            @if (enrolments().length === 0) {
              <div class="card-body text-body-secondary">This student is not enrolled in any batch yet.</div>
            } @else {
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead><tr><th>Batch</th><th>Course</th><th>Enrolled on</th><th class="text-end">Attendance</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    @for (e of enrolments(); track e.enrolmentId) {
                      <tr>
                        <td><a [routerLink]="['/batches', e.batchId]" class="fw-semibold">{{ e.batchCode }}</a></td>
                        <td>{{ e.courseTitle }}</td>
                        <td class="small text-nowrap">{{ e.enrolmentDate | date: 'dd MMM yyyy' }}</td>
                        <td class="text-end tabular">
                          {{ e.attendancePercentage === null ? '—' : (e.attendancePercentage | number: '1.0-2') + '%' }}
                        </td>
                        <td><app-status-badge [status]="e.status" /></td>
                        <td class="actions-cell">
                          <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/enrolments', e.enrolmentId, 'edit']" title="Edit">
                            <i class="bi bi-pencil"></i></a>
                        </td>
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
export class StudentDetailPage implements OnInit {
  readonly id = input.required<string>();
  private readonly students = inject(StudentService);
  private readonly enrolmentApi = inject(EnrolmentService);

  readonly student = signal<Student | null>(null);
  readonly enrolments = signal<Enrolment[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    const id = +this.id();
    forkJoin([this.students.get(id), this.enrolmentApi.list({ studentId: id })]).subscribe({
      next: ([s, e]) => { this.student.set(s); this.enrolments.set(e); this.loading.set(false); },
      error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
    });
  }
}
