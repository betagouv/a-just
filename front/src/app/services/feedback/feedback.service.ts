import { inject, Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { FeedbackStatusInterface } from '../../interfaces/feedback'

const SESSION_DISMISS_KEY = 'feedback-banner-dismissed'

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  serverService = inject(ServerService)

  async hasResponded(): Promise<boolean> {
    const result = await this.serverService.getWithoutError('feedback/status')

    const status = result.data as FeedbackStatusInterface

    return status?.hasResponded === true
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
