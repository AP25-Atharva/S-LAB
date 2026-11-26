import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar';
import { ConfirmDialog, Toasts } from './shared/overlays';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ConfirmDialog, Toasts],
  template: `
    <app-navbar />
    <main class="container-xl px-3 px-lg-4 py-4">
      <router-outlet />
    </main>
    <app-confirm-dialog />
    <app-toasts />
  `,
})
export class App {}
