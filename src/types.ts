// Add these interfaces to the existing types.ts file

export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  username: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  isBanned: boolean;
  following: number;
  followers: number;
  bio: string;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
  friends?: string[];
  friendRequests?: {
    sent: string[];
    received: string[];
  };
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  sender?: User;
  receiver?: User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}