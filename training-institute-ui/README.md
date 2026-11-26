# BatchWise – Training Institute UI (Angular)

Angular 22 front end for **BatchWise**, the *Training Institute Course and Batch Management System*.
It talks to the Spring Boot API in `../training-institute-api`.

## Run

```bash
# 1. Start the API first (port 8080), from training-institute-api:
./mvnw spring-boot:run

# 2. Start the UI (port 4200):
npm install      # first time only
npm start        # = ng serve
```

Open http://localhost:4200. The API base URL is set in `src/environments/environment.ts`.

## Pages

| Route | Page |
|---|---|
| `/dashboard` | Active courses, running/planned batches, enrolment counts by status, upcoming and overdue batches |
| `/courses`, `/trainers`, `/students` | List with search and status filter, plus activate/deactivate and delete |
| `/courses/new`, `/courses/:id`, `/courses/:id/edit` (same for trainers and students) | Form with field-level validation, and a detail page |
| `/batches` | Batch list filtered by status and course, with seat usage |
| `/batches/new`, `/batches/:id/edit` | Batch scheduling form with course and trainer selectors |
| `/batches/:id` | Batch summary (capacity, seats, average attendance, start/complete/cancel) and roster |
| `/enrolments` | Enrolment list filtered by status and batch, with withdraw and delete |
| `/enrolments/new`, `/enrolments/:id/edit` | Enrolment form with a live seat check and a "waitlist instead" option for full batches |

## Structure

```
src/app/
  core/       models.ts (DTO types), api.services.ts (one HttpClient service per resource),
              api-error.ts (API error → form errors), ui.services.ts (toasts, confirm dialog)
  shared/     navbar, status-badge, seat-bar, field-error, confirm-dialog + toasts, page-header, load-state
  pages/      dashboard, courses, trainers, students, batches, enrolments
```

Business rules (capacity, duplicate enrolment, no hard delete with dependents) are enforced by the API.
The UI shows the API's error messages: field errors appear under the matching inputs, and rule
violations appear as alerts or toasts.
