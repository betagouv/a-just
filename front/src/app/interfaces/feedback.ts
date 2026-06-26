export interface FeedbackStatusInterface {
  hasResponded: boolean
}

export interface FeedbackSubmitInterface {
  rating: number
  comment?: string
  page?: string
}

export const FEEDBACK_QUESTION = 'Comment évaluez-vous votre expérience avec A-JUST ?'

export const FEEDBACK_BANNER_TEXT = "Quel est votre niveau de satisfaction concernant l'outil A-JUST ?"

export const FEEDBACK_BANNER_BUTTON = 'Je donne mon avis'

export const FEEDBACK_POPUP_TITLE = 'Votre avis compte'
