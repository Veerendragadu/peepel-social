import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Message, User } from '../../types';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  sender: User;
}

export function ChatMessage({ message, isOwnMessage, sender }: ChatMessageProps) {
  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex items-end space-x-2 max-w-[70%] ${
          isOwnMessage ? 'flex-row-reverse space-x-reverse' : 'flex-row'
        }`}
      >
        <img
          src={sender.avatar}
          alt={sender.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-[#6b9ded] text-white'
              : 'bg-white/10 text-white'
          }`}
        >
          <p className="text-sm break-words whitespace-pre-wrap" style={{ wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br>') }} />
          <span className="text-xs opacity-60 mt-1 block">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}