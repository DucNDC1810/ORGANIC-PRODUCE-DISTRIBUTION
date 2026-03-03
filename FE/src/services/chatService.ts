import api from './api';

export interface ChatResponse {
  reply: string;
}

export const chatService = {
  sendMessage: (message: string) =>
    api.post<ChatResponse>('/chat', { message }),
};
