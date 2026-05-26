import { X, Users, LogOut, Image, FileText, Info } from 'lucide-react';
import Avatar from '../shared/Avatar';
import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';

interface InfoPanelProps {
  conversation: any;
  onClose: () => void;
  onLeaveGroup?: () => void;
}

export default function InfoPanel({ conversation, onClose, onLeaveGroup }: InfoPanelProps) {
  const { messages } = useChat();
  const [activeTab, setActiveTab] = useState<'details' | 'media'>('details');

  const isGroup = conversation.type === 'group';
  const displayName = isGroup ? (conversation.name || 'Group') : (conversation.other_user_name || 'User');
  const avatarUrl = isGroup ? conversation.avatar_url : conversation.other_user_avatar;

  // Filter media & files
  const sharedMedia = messages.filter(m => m.messageType === 'image');
  const sharedDocs = messages.filter(m => m.messageType === 'file' || m.messageType === 'audio');

  return (
    <div className="w-full md:w-[340px] absolute md:relative inset-y-0 right-0 h-full shrink-0 flex flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-xl transition-all z-20">
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
        <h3 className="font-semibold text-white">Info</h3>
        <button onClick={onClose} className="p-1.5 text-[var(--text-tertiary)] hover:text-white rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-chat)] shrink-0">
        <button
          onClick={() => setActiveTab('details')}
          className="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors"
          style={{
            borderColor: activeTab === 'details' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'details' ? 'white' : 'var(--text-secondary)',
          }}
        >
          <Info size={16} /> Details
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors"
          style={{
            borderColor: activeTab === 'media' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'media' ? 'white' : 'var(--text-secondary)',
          }}
        >
          <Image size={16} /> Media
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'details' ? (
          <>
            {/* Profile Info */}
            <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-[var(--border-subtle)]">
              <Avatar name={displayName} src={avatarUrl} size={100} />
              <h2 className="mt-4 text-xl font-bold text-white text-center break-all">{displayName}</h2>
              {!isGroup && <p className="text-sm text-[var(--text-secondary)] mt-1">{conversation.other_user_email}</p>}
            </div>

            {/* Group Actions */}
            {isGroup && (
              <div className="px-4 py-6">
                <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <Users size={16} /> Members
                </h4>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name="Me" size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">You</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={onLeaveGroup}
                    className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:bg-opacity-10 transition-colors"
                  >
                    <LogOut size={18} /> Leave Group
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 flex flex-col gap-6">
            {/* Shared Media */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                Photos & Videos ({sharedMedia.length})
              </h4>
              {sharedMedia.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] italic">No shared media yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {sharedMedia.map(m => (
                    <div key={m.id} className="aspect-square rounded-lg overflow-hidden relative group bg-[var(--bg-input)] cursor-pointer">
                      <img 
                        src={`http://localhost:3000${m.content}`} 
                        alt="media" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shared Docs / Audios */}
            <div className="border-t border-[var(--border-subtle)] pt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                Files & Audios ({sharedDocs.length})
              </h4>
              {sharedDocs.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] italic">No shared files yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {sharedDocs.map(m => (
                    <a
                      key={m.id}
                      href={`http://localhost:3000${m.content}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-input)] hover:bg-opacity-80 transition-colors"
                    >
                      <div className="p-2 rounded bg-gray-800 text-[var(--accent-blue)]">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate font-medium">
                          {m.content.split('/').pop() || 'Shared File'}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
