# Training Institute API (Spring Boot)

The REST backend for the **Training Institute Course and Batch Management System**. It handles courses, trainers, students, batch scheduling and enrolments, enforces the capacity rules, and stores everything in MySQL.

**Stack:** Java 17+, Spring Boot 3.5 (Web, Data JPA, Validation), MySQL 8 (InnoDB)

## Project structure

```
src/main/java/com/institute/traininginstituteapi/
├── entity/       JPA entities: Course, Trainer, Student, Batch, Enrolment, plus enums
├── repository/   Spring Data JPA repositories (search and count queries)
├── dto/          Request DTOs (with validation) and response DTOs
├── service/      Business rules (capacity, duplicates, soft delete, trainer clashes)
├── controller/   REST controllers under /api/**
├── exception/    Global JSON error handling
└── config/       CORS for the Angular dev server
database/         schema.sql, sample-data.sql
postman/          Postman collection (47 requests)
```

## Setup

1. **Create the database:**
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p training_institute < database/sample-data.sql   # optional: demo data (clears existing rows)
   ```
2. **Configure credentials.** Copy `src/main/resources/application-local.properties.example` to `application-local.properties` and set your MySQL password. Git ignores that file. Alternatively, set the environment variables `DB_URL`, `DB_USERNAME` and `DB_PASSWORD`.
3. **Run:**
   ```bash
   ./mvnw spring-boot:run
   ```
   The API runs at `http://localhost:8080`. CORS allows `http://localhost:4200`.

Hibernate runs with `ddl-auto=validate`. It never changes the schema; it only checks that the entities match the tables.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Counts, running batches, upcoming (next 30 days) and delayed batches |
| GET | `/api/courses?search=&active=` | List and search courses |
| GET | `/api/courses/{id}` | Course details |
| POST | `/api/courses` | Create a course (201) |
| PUT | `/api/courses/{id}` | Update a course |
| PATCH | `/api/courses/{id}/status?active=false` | Deactivate or activate |
| DELETE | `/api/courses/{id}` | Delete; only allowed when the course has no batches (204) |
| GET | `/api/trainers?search=&active=` | List trainers, including `activeBatchCount` (workload) |
| GET/POST/PUT/DELETE | `/api/trainers[/{id}]` | Trainer CRUD |
| PATCH | `/api/trainers/{id}/status?active=false` | Deactivate; blocked while the trainer has planned or running batches |
| GET | `/api/students?search=&status=` | List and search students |
| GET/POST/PUT/DELETE | `/api/students[/{id}]` | Student CRUD |
| PATCH | `/api/students/{id}/status?status=INACTIVE` | Deactivate or activate |
| GET | `/api/batches?search=&status=&courseId=&trainerId=` | List batches with seat usage |
| GET | `/api/batches/{id}/summary` | Capacity, average attendance and full roster |
| GET/POST/PUT/DELETE | `/api/batches[/{id}]` | Batch CRUD |
| PATCH | `/api/batches/{id}/status?status=CANCELLED` | Change batch status |
| GET | `/api/enrolments?search=&status=&batchId=&studentId=` | List enrolments or a batch roster |
| GET/POST/PUT/DELETE | `/api/enrolments[/{id}]` | Enrolment CRUD |
| PATCH | `/api/enrolments/{id}/status?status=WITHDRAWN` | Withdraw, complete, or promote from the waitlist |

## Business rules

| Rule | Behaviour |
|---|---|
| Batch capacity | ENROLLED and COMPLETED students take a seat. Enrolling into a full batch returns **409**; the student can be enrolled as WAITLISTED instead. |
| No duplicate active enrolment | A student can have only one ENROLLED or WAITLISTED enrolment per batch (**409**). Re-enrolling after a withdrawal is allowed. |
| Withdrawal | `WITHDRAWN` frees the seat, so the active count goes down. |
| Open batches only | Enrolments are accepted only for PLANNED or RUNNING batches, and only for ACTIVE students. |
| Trainer clash | A trainer cannot have two planned or running batches with overlapping dates (**409**). |
| Inactive masters | New batches need an active course and an active trainer. |
| Capacity reduction | Capacity cannot be set below the number of seats already taken. |
| No delete with dependents | A course or trainer that has batches, a batch that has enrolments, or a student with enrolment history cannot be deleted (**409**). Use the status endpoint instead. |
| Batch cancellation | Cancelling a batch withdraws its ENROLLED and WAITLISTED students. CANCELLED and COMPLETED batches cannot be reopened. |
| Deleting enrolments | Only WITHDRAWN or WAITLISTED enrolments can be deleted. Active ones must be withdrawn first. |

## Error format

```json
{
  "timestamp": "2026-11-26T00:24:05",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/courses",
  "fieldErrors": { "title": "Title must be 3-150 characters", "fee": "Fee cannot be negative" }
}
```

Status codes: **200** OK, **201** Created, **204** Deleted, **400** validation or malformed input, **404** not found, **409** duplicate value or business-rule violation.

## Testing with Postman

Import `postman/Training-Institute-API.postman_collection.json`. The `baseUrl` variable defaults to `http://localhost:8080`. The request IDs match `sample-data.sql`, so reload the sample data before a demo run. The **Business rule checks** folder contains requests that are expected to fail.
