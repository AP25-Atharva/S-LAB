import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, merge } from 'rxjs';
import { TrainerService } from '../../core/api.services';
import { toApiError } from '../../core/api-error';
import { Trainer } from '../../core/models';
import { ConfirmService, ToastService } from '../../core/ui.services';
import { LoadState, PageHeader } from '../../shared/page-bits';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-trainer-list',
  imports: [RouterLink, ReactiveFormsModule, PageHeader, LoadState, StatusBadge],
  template: `
    <app-page-header title="Trainers" subtitle="Faculty who deliver the batches">
      <a class="btn btn-primary" routerLink="/trainers/new"><i class="bi bi-plus-lg me-1"></i>Add trainer</a>
    </app-page-header>

    <div class="card">
      <div class="card-body border-bottom">
        <div class="row g-2">
          <div class="col-12 col-md-8">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input class="form-control" placeholder="Search by code, name, email or expertise" [formControl]="search" />
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

      <app-load-state [loading]="loading()" [error]="error()" [empty]="!loading() && trainers().length === 0"
                      emptyText="No trainers match your search." />

      @if (!loading() && trainers().length > 0) {
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Code</th><th>Name</th><th>Contact</th><th>Expertise</th>
                  <th class="text-end">Active batches</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (t of trainers(); track t.trainerId) {
                <tr>
                  <td class="fw-semibold">{{ t.trainerCode }}</td>
                  <td><a [routerLink]="['/trainers', t.trainerId]">{{ t.fullName }}</a></td>
                  <td class="small">{{ t.email }}<br /><span class="text-body-secondary">{{ t.phone }}</span></td>
                  <td class="small">{{ t.expertise || '—' }}</td>
                  <td class="text-end tabular">{{ t.activeBatchCount }}</td>
                  <td><app-status-badge [status]="t.active" /></td>
                  <td class="actions-cell">
                    <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/trainers', t.trainerId, 'edit']" title="Edit">
                      <i class="bi bi-pencil"></i></a>
                    <button class="btn btn-sm btn-outline-secondary ms-1" (click)="toggle(t)"
                            [title]="t.active ? 'Deactivate' : 'Activate'">
                      <i class="bi" [class.bi-toggle-on]="t.active" [class.bi-toggle-off]="!t.active"></i></button>
                    <button class="btn btn-sm btn-outline-danger ms-1" (click)="remove(t)" title="Delete">
                      <i class="bi bi-trash"></i></button>
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
export class TrainerListPage implements OnInit {
  private readonly api = inject(TrainerService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly active = new FormControl('', { nonNullable: true });
  readonly trainers = signal<Trainer[]>([]);
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
      next: list => { this.trainers.set(list); this.error.set(null); this.loading.set(false); },
      error: e => { this.error.set(toApiError(e).message); this.loading.set(false); },
    });
  }

  async toggle(t: Trainer) {
    const ok = await this.confirm.ask({
      title: t.active ? 'Deactivate trainer' : 'Activate trainer',
      message: t.active
        ? `Deactivate ${t.fullName}? They can no longer be assigned to new batches.`
        : `Make ${t.fullName} available for batches again?`,
      confirmText: t.active ? 'Deactivate' : 'Activate',
    });
    if (!ok) return;
    this.api.setActive(t.trainerId, !t.active).subscribe({
      next: () => { this.toast.success(`${t.fullName} ${t.active ? 'deactivated' : 'activated'}`); this.load(); },
      error: e => this.toast.error(toApiError(e).message),
    });
  }

  async remove(t: Trainer) {
    const ok = await this.confirm.ask({
      title: 'Delete trainer',
      message: `Permanently delete ${t.fullName} (${t.trainerCode})? Trainers assigned to batches cannot be deleted; deactivate them instead.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.delete(t.trainerId).subscribe({
      next: () => { this.toast.success(`${t.fullName} deleted`); this.load(); },
      error: e => this.toast.error(toApiError(e).message),
    });
  }
}
