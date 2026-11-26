import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Adds "Authorization: Bearer <token>" to API calls. If the API answers 401 (token expired,
 * account disabled or password changed elsewhere), the user is sent back to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith(environment.apiUrl);
  const isLogin = req.url.endsWith('/auth/login');
  const token = auth.token;

  const request = isApi && token && !isLogin
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (isApi && !isLogin && err instanceof HttpErrorResponse && err.status === 401 && auth.isLoggedIn()) {
        auth.logout('expired');
      }
      return throwError(() => err);
    }),
  );
};
