import { Home, Search, PlusSquare, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../shared/Avatar';

export default function BottomNav() {
  const { user } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-[#262626] bg-black z-50 px-6 flex items-center justify-between">
      <button className="p-2 transition-transform active:scale-90 text-[var(--text-primary)]">
        <Home size={26} strokeWidth={2} />
      </button>
      
      <button className="p-2 transition-transform active:scale-90 text-[var(--text-secondary)]">
        <Search size={26} strokeWidth={2} />
      </button>
      
      <button className="p-2 transition-transform active:scale-90 text-[var(--text-secondary)]">
        <PlusSquare size={26} strokeWidth={2} />
      </button>
      
      <button className="p-2 transition-transform active:scale-90 text-[var(--text-secondary)] relative">
        <MessageCircle size={26} strokeWidth={2} />
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-primary)]"></span>
      </button>
      
      <button className="p-1 transition-transform active:scale-90 rounded-full overflow-hidden border border-transparent">
        <Avatar src={user?.avatar_url} name={user?.display_name || 'Me'} size={28} />
      </button>
    </div>
  );
}
