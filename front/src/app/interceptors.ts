import { HttpHandlerFn, HttpRequest } from '@angular/common/http'
import { inject } from '@angular/core'
import { ServerService } from './services/http-server/server.service'

/**
 * Intercepteur pour l'authentification
 * @param req
 * @param next
 * @returns
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Inject the current `AuthService` and use it to get an authentication token:
  const authToken = inject(ServerService).getToken()
  // Clone the request to add the authentication header.
  const newReq = req.clone({
    headers: req.headers.append('Authorization', authToken || ''),
    withCredentials: true,
  })
  return next(newReq)
}
