import { useChat } from '../../contexts/ChatContext';
import Avatar from '../shared/Avatar';

export default function StoriesBar() {
  const { conversations, onlineUsers, setActiveConversation } = useChat();

  // Extract unique users from direct conversations to show in "Stories"
  const storyUsers = conversations
    .filter(c => c.type === 'direct' && c.other_user_id)
    .map(c => ({
      id: c.other_user_id!,
      name: c.other_user_name || 'User',
      avatar: c.other_user_avatar,
      isOnline: onlineUsers.has(c.other_user_id!),
      conversation: c
    }))
    // Sort online users first
    .sort((a, b) => (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1));

  if (storyUsers.length === 0) return null;

  return (
    <div className="w-full px-4 py-3 border-b border-[var(--border-subtle)]" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x">
        {/* Your Story */}
        <div className="flex flex-col items-center gap-1 shrink-0 snap-start cursor-pointer">
          <div className="relative">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-gray-700 to-gray-500">
              <div className="w-full h-full rounded-full border-2 border-[var(--bg-primary)] bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
                <span className="text-2xl text-gray-400">+</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">Your note</span>
        </div>

        {/* Other Users */}
        {storyUsers.map(user => (
          <div 
            key={user.id} 
            onClick={() => setActiveConversation(user.conversation)}
            className="flex flex-col items-center gap-1 shrink-0 snap-start cursor-pointer transition-transform active:scale-95"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500">
              <div className="w-full h-full rounded-full border-2 border-[var(--bg-primary)] overflow-hidden">
                <Avatar src={user.avatar} name={user.name} size={60} />
              </div>
            </div>
            <span className="text-xs text-[var(--text-primary)] font-medium truncate w-16 text-center">
              {user.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
