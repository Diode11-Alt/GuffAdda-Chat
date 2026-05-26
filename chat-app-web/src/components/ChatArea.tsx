import { useRef, useEffect, useMemo } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MessageBubble from './chat/MessageBubble';
import MessageInput from './chat/MessageInput';
import TypingIndicator from './chat/TypingIndicator';
import ChatHeader from './chat/ChatHeader';
import InfoPanel from './chat/InfoPanel';
import { MessageCircle, Pin, X } from 'lucide-react';
import { useState } from 'react';

export default function ChatArea() {
  const { activeConversation, messages, typingUsers, sendMessage } = useChat();
  const { user } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editMessage, setEditMessage] = useState<{id: string, content: string} | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = '';

    messages.forEach(msg => {
      const d = new Date(msg.createdAt);
      const dateStr = d.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      let label = dateStr;
      if (d.toDateString() === now.toDateString()) label = 'Today';
      else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';

      if (label !== currentDate) {
        currentDate = label;
        groups.push({ date: label, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });

    return groups;
  }, [messages]);

  // Who is typing in this conversation
  const typingInConv = useMemo(() => {
    if (!activeConversation) return [];
    const typing: string[] = [];
    typingUsers.forEach((convId, userId) => {
      if (convId === activeConversation.id && userId !== user?.id) {
        typing.push(userId);
      }
    });
    return typing;
  }, [typingUsers, activeConversation, user]);

  // Find the last pinned message
  const pinnedMessage = useMemo(() => {
    return messages.filter(m => m.isPinned).pop();
  }, [messages]);

  // No active conversation selected
  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center instagram-chat-bg">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <MessageCircle size={40} style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Select a chat</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choose a conversation or start a new one
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full">
      <div className="flex-1 flex flex-col h-full instagram-chat-bg relative">
        <ChatHeader 
          conversation={activeConversation} 
          onInfoClick={() => setShowInfo(true)}
        />

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div className="px-4 py-2 flex items-center gap-3 cursor-pointer" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }} onClick={() => {
          // Scroll to pinned message logic could go here
        }}>
          <div style={{ color: 'var(--accent-blue)' }}>
            <Pin size={18} fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--accent-blue)' }}>Pinned Message</p>
            <p className="text-sm truncate text-gray-300">{pinnedMessage.content}</p>
          </div>
          <button 
            className="text-gray-400 hover:text-white p-1"
            onClick={(e) => {
              e.stopPropagation();
              socket?.emit('pin_message', { conversationId: activeConversation.id, messageId: pinnedMessage.id, isPinned: false });
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Say hello! 👋</p>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span
                  className="px-3 py-1 text-xs font-medium"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {group.date}
                </span>
              </div>

              {group.messages.map((msg, mi) => {
                const isMe = msg.senderId === user?.id;
                const showName = !isMe && activeConversation.type === 'group';
                const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
                const isSameSender = prevMsg?.senderId === msg.senderId;
                const repliedMessage = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : undefined;

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isMe={isMe}
                    showName={showName && !isSameSender}
                    compact={isSameSender}
                    repliedMessage={repliedMessage}
                    onReaction={(messageId, emoji) => {
                      const hasReacted = msg.reactions?.some(r => r.userId === user?.id && r.reaction === emoji);
                      if (hasReacted) {
                        socket?.emit('remove_reaction', { conversationId: activeConversation.id, messageId, reaction: emoji });
                      } else {
                        socket?.emit('add_reaction', { conversationId: activeConversation.id, messageId, reaction: emoji });
                      }
                    }}
                    onReply={(_messageId) => {
                      setReplyTo(msg);
                      setEditMessage(null);
                    }}
                    onEdit={(_messageId, content) => {
                      setEditMessage({ id: _messageId, content });
                      setReplyTo(null);
                    }}
                    onDelete={(messageId) => {
                      socket?.emit('delete_message', { conversationId: activeConversation.id, messageId, forEveryone: true });
                    }}
                    onPin={(messageId, isPinned) => {
                      socket?.emit('pin_message', { conversationId: activeConversation.id, messageId, isPinned });
                    }}
                  />
                );
              })}
            </div>
          ))
        )}

        {typingInConv.length > 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--accent-blue)' }}>Replying to {replyTo.senderName}</p>
            <p className="text-sm truncate text-gray-300 max-w-sm">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}
      <MessageInput
        editMessage={editMessage}
        onCancelEdit={() => setEditMessage(null)}
        onSend={(content, type) => {
          if (editMessage) {
            socket?.emit('edit_message', { conversationId: activeConversation.id, messageId: editMessage.id, content });
            setEditMessage(null);
          } else {
            sendMessage(content, type, replyTo?.id);
            setReplyTo(null);
          }
        }}
        onTypingStart={() => socket?.emit('typing_start', { conversationId: activeConversation.id })}
        onTypingStop={() => socket?.emit('typing_stop', { conversationId: activeConversation.id })}
      />
      </div>

      {showInfo && (
        <InfoPanel 
          conversation={activeConversation} 
          onClose={() => setShowInfo(false)} 
        />
      )}
    </div>
  );
}
