export type Sentiment = "positive" | "neutral" | "negative";

export interface ActionItem {
  task: string;
  owner: string;
  due_date: string | null;
}

export interface ParticipantSentiment {
  participant: string;
  sentiment: Sentiment;
  notes: string;
}

export interface FollowUpEmail {
  subject: string;
  body: string;
}

export interface MeetingIntelligence {
  meeting_title: string;
  summary: string;
  action_items: ActionItem[];
  key_decisions: string[];
  open_questions: string[];
  participant_sentiment: ParticipantSentiment[];
  follow_up_email: FollowUpEmail;
}

export interface AnalyzeResponse {
  id: number;
  data: MeetingIntelligence;
}

export interface MeetingListItem {
  id: number;
  meeting_title: string;
  created_at: string;
  action_item_count: number;
}

export interface MeetingListResponse {
  meetings: MeetingListItem[];
}

export interface MeetingDetailResponse {
  id: number;
  transcript: string;
  source: "text" | "audio";
  created_at: string;
  data: MeetingIntelligence;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string | { msg: string; type: string }[];
}
