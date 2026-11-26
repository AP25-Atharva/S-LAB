import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page title with optional back link and action buttons (projected content). */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  template: `
    @if (backLink(); as back) {
      <a class="small text-decoration-none d-inline-block mb-2" [routerLink]="back">
        <i class="bi bi-arrow-left"></i> {{ backLabel() }}
      </a>
    }
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 class="h3 mb-0">{{ title() }}</h1>
        @if (subtitle()) { <p class="text-body-secondary mb-0">{{ subtitle() }}</p> }
      </div>
      <div class="d-flex flex-wrap gap-2"><ng-content /></div>
    </div>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly backLink = input<string | null>(null);
  readonly backLabel = input('Back');
}

/** Loading spinner / error alert / empty message for a data section. */
@Component({
  selector: 'app-load-state',
  template: `
    @if (loading()) {
      <div class="text-center text-body-secondary py-5">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div> Loading…
      </div>
    } @else if (error()) {
      <div class="alert alert-danger d-flex align-items-start gap-2" role="alert">
        <i class="bi bi-exclamation-triangle-fill"></i><div>{{ error() }}</div>
      </div>
    } @else if (empty()) {
      <div class="text-center text-body-secondary py-5">
        <i class="bi bi-inbox fs-2 d-block mb-2"></i>{{ emptyText() }}
      </div>
    }
  `,
})
export class LoadState {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly empty = input(false);
  readonly emptyText = input('No records found.');
}
