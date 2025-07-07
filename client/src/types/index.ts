export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
}

export interface Message {
  id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  edited_at?: string;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  conversation_id: number;
}

export interface Conversation {
  id: number;
  created_at: string;
  updated_at: string;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar?: string;
  other_user_online?: boolean;
  other_user_last_seen?: string;
  last_message?: string;
  last_message_time?: string;
  last_message_sender_id?: number;
  last_message_sender_name?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}

export interface TypingUser {
  userId: number;
  userName: string;
  conversationId: number;
}
