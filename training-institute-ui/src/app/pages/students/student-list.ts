import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, merge } from 'rxjs';
import { StudentService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { STUDENT_STATUSES, Student } from '../../core/models';
import { AuthService } from '../../core/auth.service';
import { ConfirmService, ToastService } from '../../core/ui.services';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-student-list',
  imports: [RouterLink, ReactiveFormsModule, DatePipe, PageHeader, LoadState, StatusBadge],
  template: `
    <app-page-header title="Students" subtitle="Registered learners">
      <a class="btn btn-primary" routerLink="/students/new"><i class="bi bi-plus-lg me-1"></i>Add student</a>
    </app-page-header>

    <div class="card">
      <div class="card-body border-bottom">
        <div class="row g-2">
          <div class="col-12 col-md-8">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input class="form-control" placeholder="Search by code, name, email or phone" [formControl]="search" />
            </div>
          </div>
          <div class="col-12 col-md-4">
            <select class="form-select" [formControl]="status" aria-label="Filter by status">
              <option value="">All statuses</option>
              @for (s of statuses; track s) { <option [value]="s">{{ s.charAt(0) + s.slice(1).toLowerCase() }}</option> }
            </select>
          </div>
        </div>
      </div>

      <app-load-state [loading]="loading()" [error]="error()" [empty]="!loading() && students().length === 0"
                      emptyText="No students match your search." />

      @if (!loading() && students().length > 0) {
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Code</th><th>Name</th><th>Contact</th><th>Qualification</th>
                  <th>Registered</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (s of students(); track s.studentId) {
                <tr>
                  <td class="fw-semibold">{{ s.studentCode }}</td>
                  <td><a [routerLink]="['/students', s.studentId]">{{ s.fullName }}</a></td>
                  <td class="small">{{ s.email }}<br /><span class="text-body-secondary">{{ s.phone }}</span></td>
                  <td class="small">{{ s.qualification || '—' }}</td>
                  <td class="small text-nowrap">{{ s.registrationDate | date: 'dd MMM yyyy' }}</td>
                  <td><app-status-badge [status]="s.status" /></td>
                  <td class="actions-cell">
                    <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/students', s.studentId, 'edit']" title="Edit">
                      <i class="bi bi-pencil"></i></a>
                    <button class="btn btn-sm btn-outline-secondary ms-1" (click)="toggle(s)"
                            [title]="s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'">
                      <i class="bi" [class.bi-toggle-on]="s.status === 'ACTIVE'" [class.bi-toggle-off]="s.status !== 'ACTIVE'"></i></button>
                    @if (auth.isAdmin()) {
                      <button class="btn btn-sm btn-outline-danger ms-1" (click)="remove(s)" title="Delete">
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
export class StudentListPage implements OnInit {
  private readonly api = inject(StudentService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = STUDENT_STATUSES;
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly students = signal<Student[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    merge(this.search.valueChanges.pipe(debounceTime(300)), this.status.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.list({ search: this.search.value.trim(), status: this.status.value }).subscribe({
      next: list => { this.students.set(list); this.error.set(null); this.loading.set(false); },
      error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
    });
  }

  async toggle(s: Student) {
    const activate = s.status !== 'ACTIVE';
    const ok = await this.confirm.ask({
      title: activate ? 'Activate student' : 'Deactivate student',
      message: activate
        ? `Mark ${s.fullName} as active so they can enrol again?`
        : `Mark ${s.fullName} as inactive? Inactive students cannot be enrolled in new batches.`,
      confirmText: activate ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    this.api.setStatus(s.studentId, activate ? 'ACTIVE' : 'INACTIVE').subscribe({
      next: () => { this.toast.success(`${s.fullName} ${activate ? 'activated' : 'deactivated'}`); this.load(); },
      error: e => this.toast.error(toApiError(e).message),
    });
  }

  async remove(s: Student) {
    const ok = await this.confirm.ask({
      title: 'Delete student',
      message: `Permanently delete ${s.fullName} (${s.studentCode})? Students with enrolments cannot be deleted; mark them inactive instead.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.delete(s.studentId).subscribe({
      next: () => { this.toast.success(`${s.fullName} deleted`); this.load(); },
      error: e => this.toast.error(toApiError(e).message),
    });
  }
}
