import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService, ToastService } from '../core/ui.services';

/** Modal confirmation dialog driven by ConfirmService.ask(). */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (confirm.pending(); as p) {
      <div class="modal-backdrop fade show"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true"
           (click)="confirm.close(false)">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ p.title }}</h5>
              <button type="button" class="btn-close" aria-label="Close" (click)="confirm.close(false)"></button>
            </div>
            <div class="modal-body"><p class="mb-0">{{ p.message }}</p></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="confirm.close(false)">Cancel</button>
              <button type="button" class="btn" [class.btn-danger]="p.danger" [class.btn-primary]="!p.danger"
                      (click)="confirm.close(true)">{{ p.confirmText ?? 'Confirm' }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly confirm = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.confirm.pending()) this.confirm.close(false);
  }
}

/** Toast notifications from ToastService. */
@Component({
  selector: 'app-toasts',
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast show align-items-center text-bg-{{ t.kind }} border-0" role="status">
          <div class="d-flex">
            <div class="toast-body">{{ t.text }}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"
                    (click)="toast.dismiss(t.id)"></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  readonly toast = inject(ToastService);
}
