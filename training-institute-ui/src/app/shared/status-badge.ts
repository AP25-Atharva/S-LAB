import { Component, computed, input } from '@angular/core';

const COLORS: Record<string, string> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  PLANNED: 'info',
  RUNNING: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'secondary',
  ENROLLED: 'primary',
  WAITLISTED: 'warning',
  WITHDRAWN: 'secondary',
  FULL: 'danger',
};

/** Coloured pill for any status. Booleans are shown as Active / Inactive. */
@Component({
  selector: 'app-status-badge',
  template: `<span class="badge rounded-pill text-bg-{{ color() }}">{{ label() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<string | boolean>();

  readonly key = computed(() => {
    const s = this.status();
    return typeof s === 'boolean' ? (s ? 'ACTIVE' : 'INACTIVE') : s;
  });
  readonly color = computed(() => COLORS[this.key()] ?? 'light');
  readonly label = computed(() => this.key().charAt(0) + this.key().slice(1).toLowerCase());
}
