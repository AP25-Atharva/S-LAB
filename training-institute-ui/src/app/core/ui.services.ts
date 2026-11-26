import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'danger' | 'info';
  text: string;
}

/** Small notification queue rendered by <app-toasts>. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  success(text: string) { this.show('success', text); }
  error(text: string) { this.show('danger', text, 7000); }
  info(text: string) { this.show('info', text); }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private show(kind: Toast['kind'], text: string, ms = 4000) {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, kind, text }]);
    setTimeout(() => this.dismiss(id), ms);
  }
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

/** Promise-based confirmation dialog rendered by <app-confirm-dialog>. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    this.pending()?.resolve(false);
    return new Promise(resolve => this.pending.set({ ...options, resolve }));
  }

  close(ok: boolean) {
    const p = this.pending();
    this.pending.set(null);
    p?.resolve(ok);
  }
}
