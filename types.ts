
export interface MathHistoryItem {
  id: string;
  latex: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  latex: string;
  timestamp: number;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  HISTORY = 'HISTORY',
  AI_CHAT = 'AI_CHAT'
}

export interface AiResponse {
  latex?: string;
  explanation?: string;
  error?: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
