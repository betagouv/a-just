export interface FeedbackStatusInterface {
  hasResponded: boolean
  eligibleForFeedback: boolean
}

export interface FeedbackSubmitInterface {
  rating: number
  comment?: string
  page?: string
}
