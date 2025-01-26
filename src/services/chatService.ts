import { supabase } from '../lib/supabaseClient';
import type { Message, Chat, User } from '../types';

export class ChatService {
  static async sendMessage(senderId: string, receiverId: string, content: string): Promise<void> {
    try {
      // Create a unique chat ID by sorting user IDs
      const participants = [senderId, receiverId].sort();
      
      // First, get or create chat
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .contains('participants', participants)
        .single();

      let chatId: string;

      if (!existingChat) {
        // Create new chat
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({ participants })
          .select('id')
          .single();

        if (chatError) throw chatError;
        chatId = newChat.id;
      } else {
        chatId = existingChat.id;
      }

      // Insert message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          read: false
        });

      if (messageError) throw messageError;

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static subscribeToChats(userId: string, onChatsUpdate: (chats: Chat[]) => void): () => void {
    // Subscribe to chats using Supabase realtime
    const subscription = supabase
      .channel('chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `participants=cs.{${userId}}`
        },
        async () => {
          // Fetch updated chats
          const { data: chats, error } = await supabase
            .from('chats')
            .select(`
              *,
              messages (
                id,
                content,
                sender_id,
                created_at,
                read
              )
            `)
            .contains('participants', [userId])
            .order('updated_at', { ascending: false });

          if (error) {
            console.error('Error fetching chats:', error);
            return;
          }

          // Get all unique participant IDs (excluding current user)
          const participantIds = [...new Set(chats.flatMap(chat => 
            chat.participants.filter(id => id !== userId)
          ))];

          // Fetch user details
          const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .in('id', participantIds);

          const userMap = new Map(users?.map(user => [user.id, user]) || []);

          // Format chats with user details
          const formattedChats = chats.map(chat => ({
            ...chat,
            participants: chat.participants
              .filter(id => id !== userId)
              .map(id => userMap.get(id))
              .filter(Boolean),
            lastMessage: chat.messages?.[0] || null
          }));

          onChatsUpdate(formattedChats);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  static async getMessageHistory(chatId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error fetching message history:', error);
      throw error;
    }
  }

  static subscribeToMessages(
    chatId: string,
    onMessage: (messages: Message[]) => void
  ): () => void {
    // Initial fetch
    this.getMessageHistory(chatId).then(onMessage);

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        () => {
          // Refetch messages when there are changes
          this.getMessageHistory(chatId).then(onMessage);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
}