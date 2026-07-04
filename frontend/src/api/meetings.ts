import type {
  AnalyzeResponse,
  MeetingDetailResponse,
  MeetingListResponse,
  TokenResponse,
} from "../types";
import { apiRequest } from "./client";

export function signup(email: string, password: string) {
  return apiRequest<TokenResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refresh(refreshToken: string) {
  return apiRequest<TokenResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function listMeetings(accessToken: string) {
  return apiRequest<MeetingListResponse>("/meetings", {}, accessToken);
}

export function getMeeting(id: number, accessToken: string) {
  return apiRequest<MeetingDetailResponse>(`/meetings/${id}`, {}, accessToken);
}

export function analyzeTranscript(transcript: string, accessToken: string) {
  return apiRequest<AnalyzeResponse>(
    "/meetings/analyze",
    {
      method: "POST",
      body: JSON.stringify({ transcript }),
    },
    accessToken,
  );
}

export function uploadAudio(file: File, accessToken: string) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<AnalyzeResponse>(
    "/meetings/upload-audio",
    { method: "POST", body: formData },
    accessToken,
  );
}

export async function exportMeetingPdf(id: number, accessToken: string) {
  return apiRequest<Blob>(`/meetings/${id}/export-pdf`, {}, accessToken);
}
