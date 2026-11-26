import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Batch, BatchRequest, BatchStatus, BatchSummary, Course, CourseRequest, Dashboard,
  Enrolment, EnrolmentRequest, EnrolmentStatus, Student, StudentRequest, StudentStatus,
  Trainer, TrainerRequest, User, UserCreateRequest, UserUpdateRequest,
} from './models';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

/** Drops empty values so `?search=&status=` is never sent to the API. */
function toParams(query: QueryParams): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}

/** Shared list/get/create/update/delete calls for one REST resource. */
abstract class CrudService<T, R> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly resource: string;

  protected get url(): string {
    return `${environment.apiUrl}/${this.resource}`;
  }

  list(query: QueryParams = {}): Observable<T[]> {
    return this.http.get<T[]>(this.url, { params: toParams(query) });
  }

  get(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  create(body: R): Observable<T> {
    return this.http.post<T>(this.url, body);
  }

  update(id: number, body: R): Observable<T> {
    return this.http.put<T>(`${this.url}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  protected patchStatus(id: number, query: QueryParams): Observable<T> {
    return this.http.patch<T>(`${this.url}/${id}/status`, null, { params: toParams(query) });
  }
}

@Injectable({ providedIn: 'root' })
export class CourseService extends CrudService<Course, CourseRequest> {
  protected readonly resource = 'courses';
  setActive(id: number, active: boolean) {
    return this.patchStatus(id, { active });
  }
}

@Injectable({ providedIn: 'root' })
export class TrainerService extends CrudService<Trainer, TrainerRequest> {
  protected readonly resource = 'trainers';
  setActive(id: number, active: boolean) {
    return this.patchStatus(id, { active });
  }
}

@Injectable({ providedIn: 'root' })
export class StudentService extends CrudService<Student, StudentRequest> {
  protected readonly resource = 'students';
  setStatus(id: number, status: StudentStatus) {
    return this.patchStatus(id, { status });
  }
}

@Injectable({ providedIn: 'root' })
export class BatchService extends CrudService<Batch, BatchRequest> {
  protected readonly resource = 'batches';
  setStatus(id: number, status: BatchStatus) {
    return this.patchStatus(id, { status });
  }
  summary(id: number): Observable<BatchSummary> {
    return this.http.get<BatchSummary>(`${this.url}/${id}/summary`);
  }
}

@Injectable({ providedIn: 'root' })
export class EnrolmentService extends CrudService<Enrolment, EnrolmentRequest> {
  protected readonly resource = 'enrolments';
  setStatus(id: number, status: EnrolmentStatus) {
    return this.patchStatus(id, { status });
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  get(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${environment.apiUrl}/dashboard`);
  }
}

/** Staff accounts - ADMIN only. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.url);
  }
  get(id: number): Observable<User> {
    return this.http.get<User>(`${this.url}/${id}`);
  }
  create(body: UserCreateRequest): Observable<User> {
    return this.http.post<User>(this.url, body);
  }
  update(id: number, body: UserUpdateRequest): Observable<User> {
    return this.http.put<User>(`${this.url}/${id}`, body);
  }
  resetPassword(id: number, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/password`, { newPassword });
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
