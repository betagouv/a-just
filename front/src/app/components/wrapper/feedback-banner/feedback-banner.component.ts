import { Component, ElementRef, EventEmitter, HostBinding, inject, OnInit, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MainClass } from '../../../libs/main-class'
import { FeedbackService } from '../../../services/feedback/feedback.service'
import { UserService } from '../../../services/user/user.service'
import { FEEDBACK_BANNER_BUTTON, FEEDBACK_BANNER_TEXT } from '../../../interfaces/feedback'

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

  @Output() visibilityChange = new EventEmitter<boolean>()
  @Output() openSurvey = new EventEmitter<void>()

  showBanner = false
  bannerText = FEEDBACK_BANNER_TEXT
  buttonText = FEEDBACK_BANNER_BUTTON

  @HostBinding('class.visible')
  get isVisible() {
    return this.showBanner
  }

  get offsetHeight() {
    return this.showBanner ? this.el.nativeElement.offsetHeight : 0
  }

  ngOnInit() {
    this.watch(
      this.userService.user.subscribe(() => {
        this.loadBanner()
      })
    )
  }

  loadBanner() {
    if (this.feedbackService.isSessionDismissed()) {
      this.showBanner = false
      this.visibilityChange.emit(true)
      return
    }

    this.feedbackService.hasResponded().then((responded) => {
      this.showBanner = !responded
      this.visibilityChange.emit(true)
    })
  }

  onOpenSurvey() {
    this.openSurvey.emit()
  }

  onDismiss() {
    this.feedbackService.dismissForSession()
    this.showBanner = false
    this.visibilityChange.emit(true)
  }

  hideAfterSubmit() {
    this.showBanner = false
    this.visibilityChange.emit(true)
  }
}
