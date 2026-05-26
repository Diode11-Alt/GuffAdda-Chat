import { useState } from 'react';
import { Check, CheckCheck, FileText, Download, Mic, Reply } from 'lucide-react';

interface MessageBubbleProps {
  message: {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    createdAt: string;
    messageType: string;
    status?: 'sent' | 'delivered' | 'read';
    reactions?: { userId: string; reaction: string }[];
    isEdited?: boolean;
    isPinned?: boolean;
  };
  isMe: boolean;
  showName: boolean;
  compact: boolean;
  repliedMessage?: any;
  onReaction?: (messageId: string, reaction: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string, currentContent: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string, isPinned: boolean) => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({ 
  message, isMe, showName, compact, repliedMessage, 
  onReaction, onReply, onEdit, onDelete, onPin 
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${compact ? 'mt-0.5' : 'mt-2'} animate-msg-enter`}
    >
      <div
        className="max-w-[65%] min-w-[100px] relative flex flex-col group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('.action-bar')) {
            // Toggle for mobile/touch devices
            if (window.matchMedia('(hover: none)').matches) {
              setIsHovered(prev => !prev);
            }
          }
        }}
        style={{
          alignItems: isMe ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Hover Actions */}
        {isHovered && (
          <div 
            className={`action-bar absolute top-[-36px] ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 p-1 rounded-full z-10 w-max`}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          >
            {COMMON_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => onReaction?.(message.id, emoji)}
                className="hover:scale-125 transition-transform p-1 text-lg leading-none"
              >
                {emoji}
              </button>
            ))}
            <div className="w-[1px] h-4 mx-1 bg-gray-700"></div>
            <button
              onClick={() => onReply?.(message.id)}
              className="p-1 hover:text-white transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              title="Reply"
            >
              <Reply size={16} />
            </button>
            <button
              onClick={() => onPin?.(message.id, !message.isPinned)}
              className="p-1 hover:text-white transition-colors"
              style={{ color: message.isPinned ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}
              title={message.isPinned ? 'Unpin' : 'Pin'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
            </button>
            {isMe && message.messageType === 'text' && (
              <button
                onClick={() => onEdit?.(message.id, message.content)}
                className="p-1 hover:text-white transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                title="Edit"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
            )}
            {isMe && (
              <button
                onClick={() => {
                  if (confirm('Delete this message for everyone?')) {
                    onDelete?.(message.id);
                  }
                }}
                className="p-1 hover:text-red-400 transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                title="Delete"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>
            )}
          </div>
        )}

        <div
          className="relative cursor-pointer select-none"
          onDoubleClick={() => onReaction?.(message.id, '❤️')}
          style={{
            background: message.messageType === 'image'
              ? 'transparent'
              : isMe
                ? 'linear-gradient(135deg, var(--bubble-out-start), var(--bubble-out-end))'
                : 'var(--bubble-in)',
            borderRadius: isMe
              ? (compact ? '22px' : '22px 22px 4px 22px')
              : (compact ? '22px' : '22px 22px 22px 4px'),
            padding: message.messageType === 'image' ? '0' : '8px 12px 6px 12px',
            boxShadow: message.messageType === 'image' ? 'none' : 'var(--shadow-bubble)',
            overflow: message.messageType === 'image' ? 'hidden' : 'visible',
          }}
        >
        {/* Sender name in group chats */}
        {showName && (
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent-blue)' }}>
            {message.senderName}
          </p>
        )}

        {/* Replied Message Preview */}
        {repliedMessage && (
          <div className="mb-2 pl-2 border-l-2 text-xs opacity-80" style={{ borderColor: 'var(--accent-blue)', background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
            <span className="font-semibold block" style={{ color: 'var(--accent-blue)' }}>{repliedMessage.senderName}</span>
            <span className="truncate block max-w-full">{repliedMessage.content}</span>
          </div>
        )}

        {/* Message content */}
        {message.messageType === 'image' ? (
          <div className="relative rounded-2xl overflow-hidden group/image">
            <img 
              src={message.content.startsWith('http') ? message.content : `http://${window.location.hostname}:3000${message.content}`} 
              alt="Uploaded media" 
              className="max-w-full h-auto max-h-[300px] object-cover block" 
            />
            <div 
              className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] select-none text-white/95"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            >
              {message.isEdited && <span className="mr-0.5 text-white/70">edited</span>}
              <span>{time}</span>
              {isMe && message.status === 'sent' && <Check size={12} className="text-white/60" />}
              {isMe && message.status === 'delivered' && <CheckCheck size={12} className="text-white/60" />}
              {isMe && message.status === 'read' && <CheckCheck size={12} style={{ color: 'var(--accent-blue)' }} />}
            </div>
          </div>
        ) : message.messageType === 'file' ? (
          <a 
            href={message.content.startsWith('http') ? message.content : `http://${window.location.hostname}:3000${message.content}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 bg-black/20 rounded-md mb-1 hover:bg-black/30 transition-colors"
            style={{ color: 'white', textDecoration: 'none' }}
          >
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-full">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">File Attachment</p>
              <p className="text-xs opacity-70">Click to download</p>
            </div>
            <Download size={16} className="opacity-70" />
          </a>
        ) : message.messageType === 'voice' ? (
          <div className="flex items-center gap-3 p-2 bg-black/20 rounded-md mb-1 min-w-[200px]">
            <div className="p-2 bg-green-500/20 text-green-300 rounded-full shrink-0">
              <Mic size={20} />
            </div>
            <audio 
              src={message.content.startsWith('http') ? message.content : `http://${window.location.hostname}:3000${message.content}`} 
              controls 
              className="h-8 w-full max-w-[200px]"
              style={{ filter: isMe ? 'invert(1) grayscale(1) brightness(2)' : 'none' }} // simple trick to style default audio player a bit
            />
          </div>
        ) : (
          <p className="text-[14px] leading-[20px] text-white break-words whitespace-pre-wrap">
            {message.content}
          </p>
        )}


        </div>

        {/* Timestamp + ticks - Outside the bubble for Insta style */}
        {message.messageType !== 'image' && (
          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {message.isEdited && (
              <span className="text-[10px] mr-1 text-[#737373]">
                edited
              </span>
            )}
            <span className="text-[10px] text-[#737373]">
              {time}
            </span>
            {isMe && message.status === 'sent' && (
              <Check size={12} className="text-[#737373]" />
            )}
            {isMe && message.status === 'delivered' && (
              <CheckCheck size={12} className="text-[#737373]" />
            )}
            {isMe && message.status === 'read' && (
              <span className="text-[10px] font-medium text-[#A8A8A8] ml-1">Seen</span>
            )}
            {isMe && !message.status && (
              <Check size={12} className="text-[#737373]" />
            )}
          </div>
        )}

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex gap-1 mt-1 ${isMe ? 'self-end' : 'self-start'} z-10`} style={{ marginTop: '-8px' }}>
            {Array.from(new Set(message.reactions.map(r => r.reaction))).map(emoji => {
              const count = message.reactions!.filter(r => r.reaction === emoji).length;
              return (
                <div 
                  key={emoji}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs cursor-pointer select-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                  onClick={() => onReaction?.(message.id, emoji)}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-gray-400 font-medium">{count}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
