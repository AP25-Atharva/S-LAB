import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark app-navbar shadow-sm">
      <div class="container-fluid px-3 px-lg-4">
        <a class="navbar-brand fw-semibold d-flex align-items-center gap-2" routerLink="/dashboard">
          <i class="bi bi-mortarboard-fill"></i> BatchWise
        </a>
        <button class="navbar-toggler" type="button" (click)="open.set(!open())"
                [attr.aria-expanded]="open()" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" [class.show]="open()">
          <ul class="navbar-nav ms-auto">
            @for (link of links; track link.path) {
              <li class="nav-item">
                <a class="nav-link" [routerLink]="link.path" routerLinkActive="active"
                   (click)="open.set(false)">
                  <i class="bi {{ link.icon }} me-1"></i>{{ link.label }}
                </a>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `,
})
export class Navbar {
  readonly open = signal(false);
  readonly links = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/courses', label: 'Courses', icon: 'bi-journal-bookmark' },
    { path: '/trainers', label: 'Trainers', icon: 'bi-person-badge' },
    { path: '/students', label: 'Students', icon: 'bi-people' },
    { path: '/batches', label: 'Batches', icon: 'bi-calendar3' },
    { path: '/enrolments', label: 'Enrolments', icon: 'bi-person-check' },
  ];
}
