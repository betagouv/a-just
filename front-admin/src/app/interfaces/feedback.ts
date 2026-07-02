export interface FeedbackUserInterface {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface FeedbackInterface {
  id: number;
  rating: number;
  comment: string | null;
  page: string | null;
  recontact: boolean;
  createdAt: string;
  user: FeedbackUserInterface;
}

export interface FeedbackStatsInterface {
  total: number;
  average: number;
  withComment: number;
  withoutComment: number;
  byRating: Record<number, number>;
  byMonth: { month: string; count: number }[];
  topPages: { page: string; count: number }[];
}
