import { useState, useEffect } from 'react';
import { Check, Search, X, Users, MessageSquare } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import Avatar from '../shared/Avatar';

interface NewChatModalProps {
  onClose: () => void;
}

export default function NewChatModal({ onClose }: NewChatModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  
  const { createDirectChat, setActiveConversation, loadConversations } = useChat();

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.users);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelectUser = async (user: any) => {
    if (isGroupMode) {
      if (selectedUsers.some(u => u.id === user.id)) {
        setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
      return;
    }

    try {
      const conversation = await createDirectChat(user.id);
      setActiveConversation(conversation);
      onClose();
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      const res = await apiFetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          type: 'group',
          memberIds: selectedUsers.map(u => u.id),
          name: groupName || 'New Group'
        })
      });
      const data = await res.json();
      await loadConversations();
      setActiveConversation(data.conversation);
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-md max-h-[70vh] flex flex-col"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-lg font-bold text-white">New Chat</h3>
          <button onClick={onClose} className="p-1 cursor-pointer" style={{ color: 'var(--text-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 py-2 shrink-0 border-b border-[var(--border-subtle)]">
          <button 
            onClick={() => { setIsGroupMode(false); setSelectedUsers([]); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${!isGroupMode ? 'text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
          >
            <MessageSquare size={16} /> Direct
          </button>
          <button 
            onClick={() => setIsGroupMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${isGroupMode ? 'text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
          >
            <Users size={16} /> Group
          </button>
        </div>

        {/* Selected Users / Group Name */}
        {isGroupMode && (
          <div className="px-4 py-3 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)] flex flex-col gap-3">
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Group Name (Optional)"
              className="w-full px-3 py-2 text-sm text-white placeholder-[var(--text-tertiary)] outline-none"
              style={{
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
              }}
            />
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                    <Avatar name={u.display_name} src={u.avatar_url} size={16} />
                    <span>{u.display_name.split(' ')[0]}</span>
                    <button onClick={() => handleSelectUser(u)} className="p-0.5 hover:bg-blue-500/30 rounded-full"><X size={12}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Input */}
        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 text-sm text-white placeholder-[var(--text-tertiary)] outline-none"
              style={{
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
              }}
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
          {loading && (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-tertiary)' }}>Searching...</p>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-tertiary)' }}>No users found</p>
          )}

          {!loading && !query.trim() && (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-tertiary)' }}>
              Type a name or email to find users
            </p>
          )}

          {results.map(user => {
            const isSelected = isGroupMode && selectedUsers.some(u => u.id === user.id);
            return (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors rounded-lg"
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="relative">
                  <Avatar name={user.display_name} src={user.avatar_url} size={44} />
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 bg-[var(--accent-blue)] text-white rounded-full p-0.5 border-2 border-[var(--bg-secondary)]">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{user.display_name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        {isGroupMode && selectedUsers.length > 0 && (
          <div className="p-4 border-t border-[var(--border-subtle)] shrink-0 bg-[var(--bg-secondary)] rounded-b-[var(--radius-xl)]">
            <button
              onClick={handleCreateGroup}
              className="w-full py-2.5 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--accent-blue)' }}
            >
              Create Group ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
