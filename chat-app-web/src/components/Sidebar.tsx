import { useState, useEffect } from 'react';
import { LogOut, Settings, Plus, Search, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import Avatar from './shared/Avatar';
import Badge from './shared/Badge';
import NewChatModal from './sidebar/NewChatModal';
import SettingsModal from './sidebar/SettingsModal';
import StoriesBar from './sidebar/StoriesBar';
import { apiFetch } from '../services/api';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { conversations, activeConversation, setActiveConversation, onlineUsers } = useChat();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredConversations = conversations.filter(c => {
    if (!search.trim()) return true;
    const name = c.type === 'direct' ? (c.other_user_name || '') : (c.name || '');
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const onlineContacts = conversations
    .filter(c => c.type === 'direct' && c.other_user_id && onlineUsers.has(c.other_user_id))
    .map(c => ({ id: c.other_user_id, name: c.other_user_name, avatar: c.other_user_avatar }));
  
  // Remove duplicates by id
  const uniqueOnlineContacts = Array.from(new Map(onlineContacts.map(item => [item.id, item])).values());

  // Debounced search for messages
  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiFetch(`/api/messages/search?q=${encodeURIComponent(search.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="w-full md:w-[360px] flex flex-col h-full shrink-0" style={{ background: 'var(--bg-secondary)' }}>
        {/* Header - Instagram Style */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 cursor-pointer">
            <h2 className="text-xl font-bold text-white tracking-tight">{user?.display_name || 'Direct'}</h2>
            <span className="text-gray-400 mt-1">˅</span>
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 transition-colors cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
            title="New Message"
          >
            {/* Insta style edit/new icon */}
            <svg aria-label="New message" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <path d="M12.202 3.203H5.25a3 3 0 0 0-3 3V18.75a3 3 0 0 0 3 3h12.547a3 3 0 0 0 3-3v-6.952" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              <path d="M10.002 17.226H6.774v-3.228L18.607 2.165a1.417 1.417 0 0 1 2.004 0l1.224 1.225a1.417 1.417 0 0 1 0 2.004Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.848" x2="20.076" y1="3.924" y2="7.153"></line>
            </svg>
          </button>
        </div>

        {/* Stories Bar */}
        <StoriesBar />

        {/* Search */}
        <div className="px-4 py-2 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full pl-9 pr-8 py-2 text-[15px] text-white placeholder-gray-400 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                border: 'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Stories / Active Users (only show when not searching) */}
        {!search.trim() && uniqueOnlineContacts.length > 0 && (
          <div className="px-4 py-3 shrink-0 flex gap-4 overflow-x-auto scrollbar-none border-b border-[var(--border-subtle)]">
            <div className="flex flex-col items-center gap-1 cursor-pointer">
              <div className="relative">
                <Avatar src={user?.avatar_url} name={user?.display_name || 'Me'} size={60} />
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-300 text-black rounded-full flex items-center justify-center font-bold text-lg leading-none pb-0.5">+</div>
                </div>
              </div>
              <span className="text-[11px] text-gray-400">Your note</span>
            </div>
            
            {uniqueOnlineContacts.map(contact => (
              <div key={contact.id} className="flex flex-col items-center gap-1 cursor-pointer">
                {/* Insta-style gradient ring */}
                <div className="p-[2px] rounded-full" style={{ background: 'var(--gradient-primary)' }}>
                  <div className="p-[2px] rounded-full" style={{ background: 'var(--bg-secondary)' }}>
                    <Avatar src={contact.avatar} name={contact.name || ''} size={52} />
                  </div>
                </div>
                <span className="text-[11px] text-white max-w-[60px] truncate">{contact.name?.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {search.trim().length > 0 && (
            <div className="px-4 py-3 text-[14px] font-semibold text-white">Messages</div>
          )}
          {filteredConversations.length === 0 && search.trim().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = activeConversation?.id === conv.id;
              const displayName = conv.type === 'direct' ? (conv.other_user_name || 'User') : (conv.name || 'Group');
              const isOnline = conv.other_user_id ? onlineUsers.has(conv.other_user_id) : false;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = 'rgba(255,255,255,0.02)') }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent') }}
                >
                  <div className="relative">
                    <Avatar
                      name={displayName}
                      src={conv.type === 'direct' ? conv.other_user_avatar : conv.avatar_url}
                      size={56}
                    />
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--bg-secondary)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[15px] font-semibold text-white truncate block">
                      {displayName}
                    </span>
                    
                    <div className="flex items-center text-[14px]">
                      <p
                        className="truncate max-w-[180px]"
                        style={{ color: conv.unread_count > 0 ? 'white' : 'var(--text-secondary)', fontWeight: conv.unread_count > 0 ? '600' : '400' }}
                      >
                        {conv.last_message_sender_name && conv.type === 'group'
                          ? `${conv.last_message_sender_name}: `
                          : ''
                        }
                        {conv.last_message_content ? (
                          conv.last_message_type === 'image' ? 'Sent a photo' :
                          conv.last_message_type === 'file' ? 'Sent an attachment' :
                          conv.last_message_type === 'voice' ? 'Sent a voice message' :
                          conv.last_message_content
                        ) : 'Tap to chat'}
                      </p>
                      <span className="text-[14px] text-gray-500 mx-1">·</span>
                      <span className="text-[14px] text-gray-500 shrink-0">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Camera icon / Unread dot */}
                  <div className="shrink-0 flex items-center justify-center w-6 h-6">
                    {conv.unread_count > 0 ? (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-blue)' }} />
                    ) : (
                      <svg aria-label="Camera" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24" className="text-gray-400">
                        <path d="M12 17.502a5.502 5.502 0 1 0-5.502-5.502A5.508 5.508 0 0 0 12 17.502Zm0-9.004a3.502 3.502 0 1 1-3.502 3.502A3.506 3.506 0 0 1 12 8.498ZM21.928 6.942h-3.411a2.115 2.115 0 0 1-1.89-1.16l-.837-1.636A1.854 1.854 0 0 0 14.153 3.12h-4.306a1.85 1.85 0 0 0-1.636 1.026l-.837 1.636a2.115 2.115 0 0 1-1.89 1.16H2.072A2.074 2.074 0 0 0 0 9.014v9.914a2.074 2.074 0 0 0 2.072 2.072h19.856A2.074 2.074 0 0 0 24 18.928V9.014a2.074 2.074 0 0 0-2.072-2.072Z"></path>
                      </svg>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {search.trim().length >= 2 && (
            <>
              <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Messages</div>
              {isSearching ? (
                <div className="px-4 py-4 text-sm text-gray-500 text-center">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-4 text-sm text-gray-500 text-center">No messages found</div>
              ) : (
                searchResults.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      const conv = conversations.find(c => c.id === msg.conversation_id);
                      if (conv) setActiveConversation(conv);
                    }}
                    className="flex flex-col gap-1 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-semibold text-white">{msg.conversation_name || msg.sender_name}</span>
                      <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-300 truncate"><span className="text-blue-400">{msg.sender_name}:</span> {msg.content}</p>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer / User Profile - Hidden on mobile because of Bottom Nav */}
        <div
          className="h-14 px-4 hidden md:flex items-center justify-between shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
        >
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar_url} name={user?.display_name || 'Me'} size={36} />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white leading-tight">
                {user?.display_name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer text-gray-400 hover:text-white"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-red-500/10 transition-colors cursor-pointer text-gray-400 hover:text-red-400"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
