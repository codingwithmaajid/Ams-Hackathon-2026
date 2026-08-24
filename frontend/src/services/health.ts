import { apiClient } from './api';

export interface HealthResponse {
  status: string;
  service: string;
}

export const healthService = {
  check: () => apiClient.get<HealthResponse>('/health'),
};