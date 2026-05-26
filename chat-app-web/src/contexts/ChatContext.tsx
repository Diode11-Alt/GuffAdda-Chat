import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { apiFetch } from '../services/api';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messageType: string;
  content: string;
  replyToId?: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
  reactions?: { userId: string; reaction: string }[];
  isEdited?: boolean;
  isPinned?: boolean;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  unread_count: number;
  last_message_id?: string;
  last_message_content?: string;
  last_message_at?: string;
  last_message_sender_name?: string;
  last_message_type?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  other_user_last_seen?: string;
  other_user_active?: boolean;
}

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  typingUsers: Map<string, string>;
  onlineUsers: Set<string>;
  setActiveConversation: (conv: Conversation | null) => void;
  sendMessage: (content: string, type?: string, replyToId?: string) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  createDirectChat: (otherUserId: string) => Promise<Conversation>;
}

const ChatContext = createContext<ChatState | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await apiFetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await apiFetch(`/api/messages/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.messages.map((m: any) => ({
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderAvatar: m.sender_avatar,
          messageType: m.message_type,
          content: m.encrypted_payload,
          replyToId: m.reply_to_id,
          createdAt: m.created_at,
          status: m.status,
          reactions: m.reactions,
          isEdited: m.is_edited,
          isPinned: m.is_pinned,
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  // Set active conversation + join room + load messages
  const setActiveConversation = useCallback((conv: Conversation | null) => {
    // Leave old room
    if (activeConversation && socket) {
      socket.emit('leave_chat', { conversationId: activeConversation.id });
    }

    setActiveConversationId(conv ? conv.id : null);
    setMessages([]);

    if (conv && socket) {
      socket.emit('join_chat', { conversationId: conv.id });
      loadMessages(conv.id);

      // Emit message_read for the last message
      const lastMsg = conv.last_message_id;
      socket.emit('message_read', { conversationId: conv.id, messageId: lastMsg });

      // Update local unread count
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
      );
    }
  }, [activeConversation, socket, loadMessages]);

  // Send message
  const sendMessage = useCallback((content: string, type = 'text', replyToId?: string) => {
    if (!socket || !activeConversation || !content.trim()) return;

    socket.emit('send_message', {
      conversationId: activeConversation.id,
      type,
      content: content.trim(),
      replyToId,
    });
  }, [socket, activeConversation]);

  // Create direct chat
  const createDirectChat = useCallback(async (otherUserId: string): Promise<Conversation> => {
    const res = await apiFetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ type: 'direct', memberIds: [otherUserId] }),
    });
    const data = await res.json();
    await loadConversations();
    return data.conversation;
  }, [loadConversations]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    if (!user) return;

    // New message received
    const handleMessage = (msg: any) => {
      const newMsg: Message = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        messageType: msg.messageType,
        content: msg.content,
        replyToId: msg.replyToId,
        createdAt: msg.createdAt,
        status: msg.senderId === user?.id ? 'sent' : undefined,
        reactions: [],
      };

      // Show notification if hidden
      if (document.hidden && msg.senderId !== user?.id && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`New message from ${msg.senderName}`, {
          body: msg.content,
          icon: msg.senderAvatar || '/vite.svg',
        });
      }

      // Only add to messages if it's for the active conversation
      if (msg.conversationId === activeConversation?.id) {
        setMessages(prev => {
          // Deduplicate
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      // Read receipts
      if (msg.senderId !== user?.id) {
        if (msg.conversationId === activeConversation?.id && document.hasFocus()) {
          socket.emit('message_read', { conversationId: msg.conversationId, messageId: msg.id });
        } else {
          socket.emit('message_delivered', { conversationId: msg.conversationId, messageId: msg.id });
        }
      }

      // Update conversation list (last message + unread)
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id === msg.conversationId) {
            return {
              ...c,
              last_message_content: msg.content,
              last_message_at: msg.createdAt,
              last_message_sender_name: msg.senderName,
              last_message_type: msg.messageType,
              unread_count: c.id === activeConversation?.id ? 0 : c.unread_count + (msg.senderId !== user.id ? 1 : 0),
            };
          }
          return c;
        });
        // Sort by last message time
        return updated.sort((a, b) => {
          const timeA = a.last_message_at || a.created_at;
          const timeB = b.last_message_at || b.created_at;
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        });
      });
    };

    // Typing indicators
    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        if (data.isTyping) {
          next.set(data.userId, data.conversationId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    };

    // Presence
    const handleOnline = (data: { userId: string }) => {
      setOnlineUsers(prev => new Set(prev).add(data.userId));
      setConversations(prev =>
        prev.map(c => c.other_user_id === data.userId ? { ...c, other_user_active: true } : c)
      );
    };
    const handleOffline = (data: { userId: string; lastSeen?: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
      setConversations(prev =>
        prev.map(c =>
          c.other_user_id === data.userId
            ? { ...c, other_user_active: false, other_user_last_seen: data.lastSeen || new Date().toISOString() }
            : c
        )
      );
    };

    const handleMessageStatus = (data: { messageId: string; userId: string; status: 'delivered' | 'read' }) => {
      setMessages(prev => prev.map(m => {
        if (m.id === data.messageId) {
          // If already read, ignore delivered
          if (m.status === 'read') return m;
          return { ...m, status: data.status };
        }
        return m;
      }));
    };

    const handleReactionAdd = (data: { messageId: string; userId: string; reaction: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.id === data.messageId) {
          const newReactions = [...(m.reactions || [])];
          if (!newReactions.some(r => r.userId === data.userId && r.reaction === data.reaction)) {
            newReactions.push({ userId: data.userId, reaction: data.reaction });
          }
          return { ...m, reactions: newReactions };
        }
        return m;
      }));
    };

    const handleReactionRemove = (data: { messageId: string; userId: string; reaction: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.id === data.messageId) {
          const newReactions = (m.reactions || []).filter(r => !(r.userId === data.userId && r.reaction === data.reaction));
          return { ...m, reactions: newReactions };
        }
        return m;
      }));
    };

    const handleMessageEdited = (data: { messageId: string; content: string }) => {
      setMessages(prev => prev.map(m => 
        m.id === data.messageId ? { ...m, content: data.content, isEdited: true } : m
      ));
    };

    const handleMessageDeleted = (data: { messageId: string; forEveryone: boolean }) => {
      if (data.forEveryone) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    };

    const handleMessagePinned = (data: { messageId: string; isPinned: boolean }) => {
      setMessages(prev => prev.map(m => 
        m.id === data.messageId ? { ...m, isPinned: data.isPinned } : m
      ));
    };

    socket.on('receive_message', handleMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);
    socket.on('message_status_update', handleMessageStatus);
    socket.on('message_reaction_add', handleReactionAdd);
    socket.on('message_reaction_remove', handleReactionRemove);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_pinned', handleMessagePinned);

    return () => {
      socket.off('receive_message', handleMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_online', handleOnline);
      socket.off('user_offline', handleOffline);
      socket.off('message_status_update', handleMessageStatus);
      socket.off('message_reaction_add', handleReactionAdd);
      socket.off('message_reaction_remove', handleReactionRemove);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_pinned', handleMessagePinned);
    };
  }, [socket, user, activeConversation?.id]);

  // Load conversations on mount
  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      messages,
      typingUsers,
      onlineUsers,
      setActiveConversation,
      sendMessage,
      loadConversations,
      loadMessages,
      createDirectChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
