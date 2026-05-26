import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import Avatar from '../shared/Avatar';
import { useChat } from '../../contexts/ChatContext';
import { useWebRTC } from '../../contexts/WebRTCContext';

interface ChatHeaderProps {
  conversation: {
    id: string;
    type: 'direct' | 'group';
    name?: string;
    other_user_name?: string;
    other_user_avatar?: string;
    other_user_id?: string;
    other_user_last_seen?: string;
    avatar_url?: string;
  };
  onInfoClick?: () => void;
}

export default function ChatHeader({ conversation, onInfoClick }: ChatHeaderProps) {
  const { onlineUsers, setActiveConversation } = useChat();
  const { initiateCall } = useWebRTC();
  const displayName = conversation.type === 'direct'
    ? (conversation.other_user_name || 'User')
    : (conversation.name || 'Group');
  const avatarSrc = conversation.type === 'direct'
    ? conversation.other_user_avatar
    : conversation.avatar_url;
  const isOnline = conversation.other_user_id ? onlineUsers.has(conversation.other_user_id) : false;

  const getStatusText = () => {
    if (conversation.type === 'group') return 'Tap for group info';
    if (isOnline) return 'online';
    if (conversation.other_user_last_seen) {
      const d = new Date(conversation.other_user_last_seen);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'last seen just now';
      if (mins < 60) return `last seen ${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `last seen ${hrs}h ago`;
      return `last seen ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }
    return 'offline';
  };

  return (
    <div
      className="h-[60px] px-4 flex items-center justify-between shrink-0"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={onInfoClick}>
        <button 
          onClick={(e) => { e.stopPropagation(); setActiveConversation(null); }}
          className="md:hidden p-1.5 -ml-2 rounded-full hover:bg-black/10 transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          <ArrowLeft size={22} />
        </button>
        <Avatar name={displayName} src={avatarSrc} size={42} online={conversation.type === 'direct' ? isOnline : undefined} />
        <div className="min-w-0 ml-1">
          <h3 className="text-[15px] font-semibold text-white truncate">{displayName}</h3>
          <p
            className="text-xs truncate"
            style={{ color: isOnline ? 'var(--accent-blue)' : 'var(--text-secondary)' }}
          >
            {getStatusText()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => initiateCall(conversation.id, 'voice')}
          className="p-2.5 rounded-full transition-colors cursor-pointer hover:bg-black/10" 
          style={{ color: 'var(--text-secondary)' }}
        >
          <Phone size={20} />
        </button>
        <button 
          onClick={() => initiateCall(conversation.id, 'video')}
          className="p-2.5 rounded-full transition-colors cursor-pointer hover:bg-black/10" 
          style={{ color: 'var(--text-secondary)' }}
        >
          <Video size={20} />
        </button>
        <button className="p-2.5 rounded-full transition-colors cursor-pointer hover:bg-black/10" style={{ color: 'var(--text-secondary)' }}>
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}
