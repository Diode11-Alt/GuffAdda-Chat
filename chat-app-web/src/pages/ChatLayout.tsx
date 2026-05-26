import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import CallModal from '../components/chat/CallModal';
import BottomNav from '../components/layout/BottomNav';
import { useChat } from '../contexts/ChatContext';

export default function ChatLayout() {
  const { activeConversation } = useChat();

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar: Full width on mobile if no active chat, shrink-0 on desktop */}
      <div className={`h-full shrink-0 ${activeConversation ? 'hidden md:block' : 'w-full md:w-auto'} pb-16 md:pb-0`}>
        <Sidebar />
      </div>
      
      {/* Chat Area: takes remaining space on desktop, full width on mobile */}
      <div className={`flex-1 h-full flex-col min-w-0 ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
        <ChatArea />
      </div>
      
      {/* Bottom Navigation for Mobile */}
      {!activeConversation && <BottomNav />}
      
      <CallModal />
    </div>
  );
}
