export interface FeedbackStatusInterface {
  hasResponded: boolean
}

export interface FeedbackSubmitInterface {
  rating: number
  comment?: string
  page?: string
}

export const FEEDBACK_QUESTION = 'Comment évaluez-vous votre expérience avec A-JUST ?'

export const FEEDBACK_BANNER_TEXT = 'Envie de donner votre avis ?'

export const FEEDBACK_BANNER_BUTTON = 'Donner mon avis'

export const FEEDBACK_POPUP_TITLE = 'Votre avis compte'
