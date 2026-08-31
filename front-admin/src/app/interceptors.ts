import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ServerService } from './services/http-server/server.service';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) {
  // Inject the current `AuthService` and use it to get an authentication token:
  const authToken = inject(ServerService).getToken();
  // Clone the request to add the authentication header.
  const newReq = req.clone({
    url: `${import.meta.env.NG_APP_SERVER_URL}${req.url}`,
    headers: req.headers.append('Authorization', authToken || ''),
    withCredentials: true,
  });
  return next(newReq);
}
