import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { Navbar } from './shared/navbar';
import { ConfirmDialog, Toasts } from './shared/overlays';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ConfirmDialog, Toasts],
  template: `
    @if (auth.isLoggedIn()) {
      <app-navbar />
      <main class="container-xl px-3 px-lg-4 py-4">
        <router-outlet />
      </main>
    } @else {
      <router-outlet />
    }
    <app-confirm-dialog />
    <app-toasts />
  `,
})
export class App {
  readonly auth = inject(AuthService);

  constructor() {
    // pick up role/name changes made by an admin since the last visit
    this.auth.refresh();
  }
}
