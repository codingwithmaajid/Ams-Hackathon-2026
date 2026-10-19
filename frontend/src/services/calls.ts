import { apiClient } from './api';

export interface CallRequest {
  agent_id?: string;
  phone_number: string;
  user_data?: Record<string, unknown>;
}

export interface CallResponse {
  call_id: string | null;
  status: string;
  message: string;
}

export interface CallStatusResponse {
  call_id: string;
  status: string;
  is_terminal: boolean;
  duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  recording_url: string | null;
  error_message: string | null;
}

export const callsService = {
  placeCall: (
    phoneNumber: string,
    agentId?: string,
    userData?: Record<string, unknown>
  ) =>
    apiClient.post<CallResponse>('/call', {
      phone_number: phoneNumber,
      ...(agentId ? { agent_id: agentId } : {}),
      ...(userData ? { user_data: userData } : {}),
    } satisfies CallRequest),
  getStatus: (callId: string) =>
    apiClient.get<CallStatusResponse>(`/call/${callId}`),
};
