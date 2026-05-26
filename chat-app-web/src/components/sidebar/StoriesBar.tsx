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
    <div className="w-full px-4 pt-4 pb-2 border-b border-[#262626] bg-black shrink-0">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x">
        {/* Your Story */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer w-[72px]">
          <div className="relative">
            <div className="w-[68px] h-[68px] rounded-full p-[3px] bg-gradient-to-tr from-gray-700 to-gray-500">
              <div className="w-full h-full rounded-full border-2 border-black bg-[#262626] flex items-center justify-center overflow-hidden">
                <span className="text-2xl text-gray-400 font-light">+</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-[#A8A8A8] font-normal truncate w-full text-center">Your note</span>
        </div>

        {/* Other Users */}
        {storyUsers.map(user => (
          <div 
            key={user.id} 
            onClick={() => setActiveConversation(user.conversation)}
            className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer transition-transform active:scale-95 w-[72px]"
          >
            <div className="w-[68px] h-[68px] rounded-full p-[3px] bg-gradient-to-tr from-[#FF3040] via-[#E1306C] to-[#F56040]">
              <div className="w-full h-full rounded-full border-[3px] border-black overflow-hidden bg-[#262626] flex items-center justify-center">
                <Avatar src={user.avatar} name={user.name} size={56} className="!w-full !h-full" />
              </div>
            </div>
            <span className="text-[11px] text-white font-normal truncate w-full text-center">
              {user.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
