import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { environment } from '../../environments/environment';

/** Normalised form of the API's JSON error body (GlobalExceptionHandler.ErrorResponse). */
export interface ApiError {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return {
        status: 0,
        message: `Cannot reach the API at ${environment.apiUrl}. Is the Spring Boot app running?`,
        fieldErrors: {},
      };
    }
    const body = err.error ?? {};
    return {
      status: err.status,
      message: body.message ?? err.message,
      fieldErrors: body.fieldErrors ?? {},
    };
  }
  return { status: -1, message: String(err), fieldErrors: {} };
}

/**
 * Puts server-side field errors onto the matching form controls (shown by <app-field-error>).
 * Returns the messages that did not match any control, so the form can show them in its alert.
 */
export function applyServerErrors(form: FormGroup, error: ApiError): string[] {
  const unmatched: string[] = [];
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    const control = form.get(field);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
    } else {
      unmatched.push(message);
    }
  }
  return unmatched;
}

/** Today's date as yyyy-MM-dd in local time (for date inputs). */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
