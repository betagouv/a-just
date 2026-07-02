import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { PopupComponent } from '../../../components/popup/popup.component'
import { AlertSmallComponent } from '../../../components/alert-small/alert-small.component'
import { AppService } from '../../../services/app/app.service'
import { FeedbackService } from '../../../services/feedback/feedback.service'
import { RadioButtonComponent } from '../../radio-button/radio-button.component'
import { FEEDBACK_POPUP_NOTIFICATION_THANKS, FEEDBACK_POPUP_TITLE, FEEDBACK_QUESTION } from '../../../constants/feedback'

@Component({
  selector: 'aj-popin-feedback',
  imports: [CommonModule, FormsModule, PopupComponent, AlertSmallComponent, RadioButtonComponent],
  templateUrl: './popin-feedback.component.html',
  styleUrls: ['./popin-feedback.component.scss'],
})
export class PopinFeedbackComponent {
  appService = inject(AppService)
  feedbackService = inject(FeedbackService)
  router = inject(Router)

  @Input() visible = false
  @Output() onClose = new EventEmitter<void>()
  @Output() onSubmitted = new EventEmitter<void>()

  title = FEEDBACK_POPUP_TITLE
  question = FEEDBACK_QUESTION
  selectedRating = 0
  comment = ''
  recontact = false
  isSubmitting = false
  showRatingAlert = false
  stars = [1, 2, 3, 4, 5]

  onAction(action: { id: string }) {
    if (action.id === 'cancel') {
      this.onClose.emit()
      return
    }

    if (action.id === 'submit') {
      this.submit()
    }
  }

  selectRating(star: number) {
    this.selectedRating = star
    this.showRatingAlert = false
  }

  submit() {
    if (this.selectedRating === 0) {
      this.showRatingAlert = true
      return
    }

    if (this.isSubmitting) {
      return
    }

    this.isSubmitting = true

    this.feedbackService
      .submit(this.selectedRating, this.comment.trim() || undefined, this.router.url, this.recontact)
      .then(() => {
        this.appService.notification(FEEDBACK_POPUP_NOTIFICATION_THANKS)
        this.resetForm()
        this.onSubmitted.emit()
      })
      .catch(() => {
        this.isSubmitting = false
      })
  }

  resetForm() {
    this.selectedRating = 0
    this.comment = ''
    this.recontact = false
    this.isSubmitting = false
    this.showRatingAlert = false
  }

  close() {
    this.resetForm()
    this.onClose.emit()
  }
}
