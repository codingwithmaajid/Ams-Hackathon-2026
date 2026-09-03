import { apiClient } from './api';

export interface CallRequest {
  agent_id: number;
  phone_number: string;
}

export interface CallResponse {
  call_id: string;
  status: string;
  message: string;
}

export interface CallStatusResponse {
  call_id: string;
  status: string;
  duration_seconds: number | null;
  transcript: string | null;
  error_message: string | null;
}

export const callsService = {
  placeCall: (agentId: number, phoneNumber: string) =>
    apiClient.post<CallResponse>('/call', {
      agent_id: agentId,
      phone_number: phoneNumber,
    }),
  getStatus: (callId: string) =>
    apiClient.get<CallStatusResponse>(`/call/${callId}`),
};
