import { useState, useRef } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../services/api';
import Avatar from '../shared/Avatar';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user } = useAuth(); // assuming we can just fetch /me
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.about || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.url);
      }
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({ displayName, bio, avatarUrl })
      });
      if (res.ok) {
        // Fetch fresh user data and reload the window so contexts are updated easily
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-[400px] rounded-[20px] p-6 shadow-2xl relative"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>

        <div className="flex flex-col items-center mb-6">
          <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
            <Avatar src={avatarUrl} name={displayName} size={100} />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="text-white" size={24} />
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/5 text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Bio / Status</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/5 text-white outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Tell others about yourself"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || uploading}
          className="w-full mt-8 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          style={{ background: 'var(--accent-blue)' }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check size={20} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
