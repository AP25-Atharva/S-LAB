import { Component, computed, input } from '@angular/core';
import { SeatCounts } from '../core/models';

/** Capacity bar: occupied / capacity seats, red when full. */
@Component({
  selector: 'app-seat-bar',
  template: `
    <div class="d-flex align-items-center gap-2" style="min-width: 140px">
      <div class="progress flex-grow-1" style="height: 8px" role="progressbar"
           [attr.aria-valuenow]="seats().occupied" aria-valuemin="0" [attr.aria-valuemax]="seats().capacity">
        <div class="progress-bar bg-{{ color() }}" [style.width.%]="percent()"></div>
      </div>
      <small class="text-nowrap tabular">{{ seats().occupied }}/{{ seats().capacity }}</small>
    </div>
    @if (seats().waitlisted > 0) {
      <small class="text-warning-emphasis">+{{ seats().waitlisted }} waitlisted</small>
    }
  `,
})
export class SeatBar {
  readonly seats = input.required<SeatCounts>();
  readonly percent = computed(() => Math.min(100, this.seats().occupancyPercent));
  readonly color = computed(() =>
    this.seats().full ? 'danger' : this.percent() >= 80 ? 'warning' : 'success');
}
