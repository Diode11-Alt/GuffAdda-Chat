import React, { useState, useCallback, useMemo, memo } from 'react';
import { Check, CheckCheck, FileText, Download, Mic, Reply } from 'lucide-react';

export interface MessageBubbleProps {
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

const HoverActions = memo(({ 
  messageId, isMe, isPinned, messageType, content,
  onReaction, onReply, onEdit, onDelete, onPin
}: any) => (
  <div 
    className={`action-bar absolute top-[-36px] ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 p-1 rounded-full z-10 w-max`}
    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
  >
    {COMMON_REACTIONS.map(emoji => (
      <button
        key={emoji}
        onClick={(e) => { e.stopPropagation(); onReaction?.(messageId, emoji); }}
        className="hover:scale-125 transition-transform p-1 text-lg leading-none"
      >
        {emoji}
      </button>
    ))}
    <div className="w-[1px] h-4 mx-1 bg-gray-700"></div>
    <button
      onClick={(e) => { e.stopPropagation(); onReply?.(messageId); }}
      className="p-1 hover:text-white transition-colors"
      style={{ color: 'var(--text-tertiary)' }}
      title="Reply"
    >
      <Reply size={16} />
    </button>
    <button
      onClick={(e) => { e.stopPropagation(); onPin?.(messageId, !isPinned); }}
      className="p-1 hover:text-white transition-colors"
      style={{ color: isPinned ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}
      title={isPinned ? 'Unpin' : 'Pin'}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
    </button>
    {isMe && messageType === 'text' && (
      <button
        onClick={(e) => { e.stopPropagation(); onEdit?.(messageId, content); }}
        className="p-1 hover:text-white transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
        title="Edit"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
      </button>
    )}
    {isMe && (
      <button
        onClick={(e) => { 
          e.stopPropagation();
          if (window.confirm('Delete this message for everyone?')) {
            onDelete?.(messageId);
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
));

const ImageMessageContent = memo(({ content, time, isEdited, isMe, status }: any) => {
  const imgSrc = content.startsWith('http') ? content : `http://localhost:3000${content}`;
  return (
    <div className="relative rounded-2xl overflow-hidden group/image">
      <img 
        src={imgSrc} 
        alt="Uploaded media" 
        className="max-w-full h-auto max-h-[300px] object-cover block" 
        loading="lazy"
      />
      <div 
        className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] select-none text-white/95"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      >
        {isEdited && <span className="mr-0.5 text-white/70">edited</span>}
        <span>{time}</span>
        {isMe && status === 'sent' && <Check size={12} className="text-white/60" />}
        {isMe && status === 'delivered' && <CheckCheck size={12} className="text-white/60" />}
        {isMe && status === 'read' && <CheckCheck size={12} style={{ color: 'var(--accent-blue)' }} />}
      </div>
    </div>
  );
});

const FileMessageContent = memo(({ content }: { content: string }) => {
  const href = content.startsWith('http') ? content : `http://localhost:3000${content}`;
  return (
    <a 
      href={href}
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
  );
});

const VoiceMessageContent = memo(({ content, isMe }: any) => {
  const src = content.startsWith('http') ? content : `http://localhost:3000${content}`;
  return (
    <div className="flex items-center gap-3 p-2 bg-black/20 rounded-md mb-1 min-w-[200px]">
      <div className="p-2 bg-green-500/20 text-green-300 rounded-full shrink-0">
        <Mic size={20} />
      </div>
      <audio 
        src={src} 
        controls 
        className="h-8 w-full max-w-[200px]"
        style={{ filter: isMe ? 'invert(1) grayscale(1) brightness(2)' : 'none' }} 
      />
    </div>
  );
});

const TextMessageContent = memo(({ content }: { content: string }) => (
  <p className="text-[14px] leading-[20px] text-white break-words whitespace-pre-wrap">
    {content}
  </p>
));

const RepliedMessagePreview = memo(({ repliedMessage }: { repliedMessage: any }) => {
  if (!repliedMessage) return null;
  return (
    <div className="mb-2 pl-2 border-l-2 text-xs opacity-80" style={{ borderColor: 'var(--accent-blue)', background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
      <span className="font-semibold block" style={{ color: 'var(--accent-blue)' }}>{repliedMessage.senderName}</span>
      <span className="truncate block max-w-full">{repliedMessage.content}</span>
    </div>
  );
});

const StatusDisplay = memo(({ time, isEdited, isMe, status, messageType }: any) => {
  if (messageType === 'image') return null;
  return (
    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-end'}`}>
      {isEdited && (
        <span className="text-[10px] mr-1" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }}>
          edited
        </span>
      )}
      <span className="text-[10px]" style={{ color: isMe ? 'rgba(255,255,255,0.5)' : 'var(--text-tertiary)' }}>
        {time}
      </span>
      {isMe && status === 'sent' && (
        <Check size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
      )}
      {isMe && status === 'delivered' && (
        <CheckCheck size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
      )}
      {isMe && status === 'read' && (
        <CheckCheck size={14} style={{ color: 'var(--tick-read)' }} />
      )}
      {isMe && !status && (
        <Check size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
      )}
    </div>
  );
});

const ReactionsList = memo(({ reactions, messageId, isMe, onReaction }: any) => {
  if (!reactions || reactions.length === 0) return null;
  
  const emojiSet = Array.from(new Set(reactions.map((r: any) => r.reaction))) as string[];
  
  return (
    <div className={`flex gap-1 mt-1 ${isMe ? 'self-end' : 'self-start'} z-10`} style={{ marginTop: '-8px' }}>
      {emojiSet.map(emoji => {
        const count = reactions.filter((r: any) => r.reaction === emoji).length;
        return (
          <div 
            key={emoji}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs cursor-pointer select-none"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
            onClick={(e) => { e.stopPropagation(); onReaction?.(messageId, emoji); }}
          >
            <span>{emoji}</span>
            {count > 1 && <span className="text-gray-400 font-medium">{count}</span>}
          </div>
        );
      })}
    </div>
  );
}, (prev, next) => {
  if (prev.reactions?.length !== next.reactions?.length) return false;
  if (!prev.reactions || !next.reactions) return prev.reactions === next.reactions;
  for (let i = 0; i < prev.reactions.length; i++) {
    if (prev.reactions[i].reaction !== next.reactions[i].reaction) return false;
    if (prev.reactions[i].userId !== next.reactions[i].userId) return false;
  }
  return true;
});

const FastBubbleComponent = function FastBubble({ 
  message, isMe, showName, compact, repliedMessage, 
  onReaction, onReply, onEdit, onDelete, onPin 
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const time = useMemo(() => {
    return new Date(message.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [message.createdAt]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('.action-bar')) {
      if (window.matchMedia('(hover: none)').matches) {
        setIsHovered(prev => !prev);
      }
    }
  }, []);
  
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReaction?.(message.id, '❤️');
  }, [message.id, onReaction]);

  const containerStyle = useMemo(() => ({ alignItems: isMe ? 'flex-end' : 'flex-start' }), [isMe]);
  
  const bubbleStyle = useMemo(() => ({
    background: message.messageType === 'image'
      ? 'transparent'
      : isMe
        ? 'linear-gradient(135deg, var(--bubble-out-start), var(--bubble-out-end))'
        : 'var(--bubble-in)',
    borderRadius: isMe
      ? (compact ? '12px' : '18px 18px 4px 18px')
      : (compact ? '12px' : '18px 18px 18px 4px'),
    padding: message.messageType === 'image' ? '0' : '8px 12px 6px 12px',
    boxShadow: message.messageType === 'image' ? 'none' : 'var(--shadow-bubble)',
    overflow: message.messageType === 'image' ? 'hidden' : 'visible',
  }), [message.messageType, isMe, compact]);

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${compact ? 'mt-0.5' : 'mt-2'} animate-msg-enter`}>
      <div
        className="max-w-[65%] min-w-[100px] relative flex flex-col group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={containerStyle}
      >
        {isHovered && (
          <HoverActions
            messageId={message.id}
            isMe={isMe}
            isPinned={message.isPinned}
            messageType={message.messageType}
            content={message.content}
            onReaction={onReaction}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
          />
        )}

        <div
          className="relative cursor-pointer select-none"
          onDoubleClick={handleDoubleClick}
          style={bubbleStyle}
        >
          {showName && (
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent-blue)' }}>
              {message.senderName}
            </p>
          )}

          <RepliedMessagePreview repliedMessage={repliedMessage} />

          {message.messageType === 'image' ? (
            <ImageMessageContent 
              content={message.content} 
              time={time} 
              isEdited={message.isEdited} 
              isMe={isMe} 
              status={message.status} 
            />
          ) : message.messageType === 'file' ? (
            <FileMessageContent content={message.content} />
          ) : message.messageType === 'voice' ? (
            <VoiceMessageContent content={message.content} isMe={isMe} />
          ) : (
            <TextMessageContent content={message.content} />
          )}

          <StatusDisplay 
            time={time} 
            isEdited={message.isEdited} 
            isMe={isMe} 
            status={message.status} 
            messageType={message.messageType} 
          />
        </div>

        <ReactionsList 
          reactions={message.reactions} 
          messageId={message.id} 
          isMe={isMe} 
          onReaction={onReaction} 
        />
      </div>
    </div>
  );
};

export const FastBubble = memo(FastBubbleComponent, (prevProps, nextProps) => {
  if (
    prevProps.isMe !== nextProps.isMe ||
    prevProps.showName !== nextProps.showName ||
    prevProps.compact !== nextProps.compact
  ) return false;

  if (prevProps.message === nextProps.message) return true;

  const pMsg = prevProps.message;
  const nMsg = nextProps.message;

  if (
    pMsg.id !== nMsg.id ||
    pMsg.content !== nMsg.content ||
    pMsg.status !== nMsg.status ||
    pMsg.isEdited !== nMsg.isEdited ||
    pMsg.isPinned !== nMsg.isPinned ||
    pMsg.senderName !== nMsg.senderName ||
    pMsg.messageType !== nMsg.messageType ||
    pMsg.createdAt !== nMsg.createdAt
  ) return false;

  if (pMsg.reactions?.length !== nMsg.reactions?.length) return false;
  if (pMsg.reactions && nMsg.reactions) {
    for (let i = 0; i < pMsg.reactions.length; i++) {
      if (
        pMsg.reactions[i].reaction !== nMsg.reactions[i].reaction ||
        pMsg.reactions[i].userId !== nMsg.reactions[i].userId
      ) return false;
    }
  }

  if (prevProps.repliedMessage?.id !== nextProps.repliedMessage?.id) return false;

  return true;
});

export default FastBubble;
