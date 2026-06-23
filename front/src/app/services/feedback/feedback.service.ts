import { inject, Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { FeedbackStatusInterface } from '../../interfaces/feedback'

const SESSION_DISMISS_KEY = 'feedback-banner-dismissed'

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  serverService = inject(ServerService)

  hasResponded(): Promise<boolean> {
    return this.serverService.getWithoutError('feedback/status').then((d) => {
      const status = d.data as FeedbackStatusInterface
      return status?.hasResponded === true
    })
  }

  submit(rating: number, comment?: string, page?: string): Promise<any> {
    return this.serverService.post('feedback/submit', { rating, comment, page })
  }

  isSessionDismissed(): boolean {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'
  }

  dismissForSession(): void {
    sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
  }
}
