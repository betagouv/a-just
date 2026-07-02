import { inject, Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { FeedbackStatusInterface } from '../../interfaces/feedback'
import { AUTO_POPUP_SHOWN_KEY, SESSION_DISMISS_KEY } from '../../constants/feedback'

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  serverService = inject(ServerService)

  async getStatus(): Promise<FeedbackStatusInterface> {
    const result = await this.serverService.getWithoutError('feedback/status')

    return (result.data as FeedbackStatusInterface) || { hasResponded: false, eligibleForFeedback: false }
  }

  async hasResponded(): Promise<boolean> {
    const status = await this.getStatus()

    return status.hasResponded === true
  }

  submit(rating: number, comment?: string, page?: string, recontact?: boolean): Promise<any> {
    return this.serverService.post('feedback/submit', { rating, comment, page, recontact })
  }

  isSessionDismissed(): boolean {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'
  }

  dismissForSession(): void {
    sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
  }

  isAutoPopupShown(): boolean {
    return localStorage.getItem(AUTO_POPUP_SHOWN_KEY) === '1'
  }

  markAutoPopupShown(): void {
    localStorage.setItem(AUTO_POPUP_SHOWN_KEY, '1')
  }
}
