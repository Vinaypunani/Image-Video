export interface GeneratedItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  type: 'image' | 'video';
}

export interface LoadingState {
  status: 'idle' | 'enhancing' | 'generating' | 'success' | 'error';
  message?: string;
}
