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

export const callsService = {
  placeCall: (agentId: number, phoneNumber: string) =>
    apiClient.post<CallResponse>('/call', { agent_id: agentId, phone_number: phoneNumber }),
};