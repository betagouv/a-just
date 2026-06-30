import { Component, ElementRef, EventEmitter, inject, OnInit, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MainClass } from '../../../libs/main-class'
import { FeedbackService } from '../../../services/feedback/feedback.service'
import { UserService } from '../../../services/user/user.service'
import { FEEDBACK_BANNER_BUTTON, FEEDBACK_BANNER_TEXT } from '../../../constants/feedback'

@Component({
  selector: 'aj-feedback-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-banner.component.html',
  styleUrls: ['./feedback-banner.component.scss'],
})
export class FeedbackBannerComponent extends MainClass implements OnInit {
  feedbackService = inject(FeedbackService)
  userService = inject(UserService)
  el = inject(ElementRef)

  @Output() isClosed = new EventEmitter<boolean>()
  @Output() openSurvey = new EventEmitter<void>()

  showBanner = false
  bannerText = FEEDBACK_BANNER_TEXT
  buttonText = FEEDBACK_BANNER_BUTTON

  get offsetHeight() {
    return this.el.nativeElement.offsetHeight
  }

  ngOnInit() {
    this.watch(
      this.userService.user.subscribe((u) => {
        if (u) {
          this.loadBanner()
        }
      }),
    )
  }

  private isE2ETest() {
    return typeof window !== 'undefined' && Boolean((window as any).Cypress)
  }

  async loadBanner() {
    if (this.isE2ETest()) {
      this.showBanner = true
      this.notifyHeightChange()
      return
    }

    if (this.feedbackService.isSessionDismissed()) {
      this.showBanner = false
      this.notifyHeightChange()
      return
    }

    const status = await this.feedbackService.getStatus()

    setTimeout(() => {
      this.showBanner = !status.hasResponded && status.eligibleForFeedback
      this.notifyHeightChange()
    })
  }

  notifyHeightChange() {
    setTimeout(() => this.isClosed.emit(true))
  }

  onOpenSurvey() {
    this.openSurvey.emit()
  }

  onDismiss() {
    this.feedbackService.dismissForSession()
    this.showBanner = false
    this.notifyHeightChange()
  }

  hideAfterSubmit() {
    this.showBanner = false
    this.notifyHeightChange()
  }
}
