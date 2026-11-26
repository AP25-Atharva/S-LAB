import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, merge } from 'rxjs';
import { CourseService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { Course } from '../../core/models';
import { AuthService } from '../../core/auth.service';
import { ConfirmService, ToastService } from '../../core/ui.services';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-course-list',
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, PageHeader, LoadState, StatusBadge],
  template: `
    <app-page-header title="Courses" subtitle="Course catalogue offered by the institute">
      <a class="btn btn-primary" routerLink="/courses/new"><i class="bi bi-plus-lg me-1"></i>Add course</a>
    </app-page-header>

    <div class="card">
      <div class="card-body border-bottom">
        <div class="row g-2">
          <div class="col-12 col-md-8">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input class="form-control" placeholder="Search by code, title or category" [formControl]="search" />
            </div>
          </div>
          <div class="col-12 col-md-4">
            <select class="form-select" [formControl]="active" aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <app-load-state [loading]="loading()" [error]="error()" [empty]="!loading() && courses().length === 0"
                      emptyText="No courses match your search." />

      @if (!loading() && courses().length > 0) {
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Code</th><th>Title</th><th>Category</th><th class="text-end">Hours</th>
                  <th class="text-end">Fee</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (c of courses(); track c.courseId) {
                <tr>
                  <td class="fw-semibold">{{ c.courseCode }}</td>
                  <td><a [routerLink]="['/courses', c.courseId]">{{ c.title }}</a></td>
                  <td>{{ c.category }}</td>
                  <td class="text-end tabular">{{ c.durationHours }}</td>
                  <td class="text-end tabular">{{ c.fee | currency: 'INR' : 'symbol' : '1.0-2' }}</td>
                  <td><app-status-badge [status]="c.active" /></td>
                  <td class="actions-cell">
                    <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/courses', c.courseId, 'edit']" title="Edit">
                      <i class="bi bi-pencil"></i></a>
                    <button class="btn btn-sm btn-outline-secondary ms-1" (click)="toggle(c)"
                            [title]="c.active ? 'Deactivate' : 'Activate'">
                      <i class="bi" [class.bi-toggle-on]="c.active" [class.bi-toggle-off]="!c.active"></i></button>
                    @if (auth.isAdmin()) {
                      <button class="btn btn-sm btn-outline-danger ms-1" (click)="remove(c)" title="Delete">
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
export class CourseListPage implements OnInit {
  private readonly api = inject(CourseService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly active = new FormControl('', { nonNullable: true });
  readonly courses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    merge(this.search.valueChanges.pipe(debounceTime(300)), this.active.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.list({ search: this.search.value.trim(), active: this.active.value }).subscribe({
      next: list => { this.courses.set(list); this.error.set(null); this.loading.set(false); },
      error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
    });
  }

  async toggle(c: Course) {
    const ok = await this.confirm.ask({
      title: c.active ? 'Deactivate course' : 'Activate course',
      message: c.active
        ? `Deactivate ${c.courseCode} – ${c.title}? It will no longer be offered for new batches.`
        : `Make ${c.courseCode} – ${c.title} available again?`,
      confirmText: c.active ? 'Deactivate' : 'Activate',
    });
    if (!ok) return;
    this.api.setActive(c.courseId, !c.active).subscribe({
      next: () => { this.toast.success(`${c.courseCode} ${c.active ? 'deactivated' : 'activated'}`); this.load(); },
      error: e => this.toast.error(toApiError(e).message),
    });
  }

  async remove(c: Course) {
    const ok = await this.confirm.ask({
      title: 'Delete course',
      message: `Permanently delete ${c.courseCode} – ${c.title}? Courses that already have batches cannot be deleted; deactivate them instead.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.delete(c.courseId).subscribe({
      next: () => { this.toast.success(`${c.courseCode} deleted`); this.load(); },
      error: e => this.toast.error(toApiError(e).message),
    });
  }
}
