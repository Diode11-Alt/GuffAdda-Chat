import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, X } from 'lucide-react';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';

interface MessageInputProps {
  onSend: (content: string, type?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  editMessage?: { id: string, content: string } | null;
  onCancelEdit?: () => void;
}

export default function MessageInput({ onSend, onTypingStart, onTypingStop, editMessage, onCancelEdit }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { isRecording, startRecording, stopRecording, cancelRecording, audioBlob, clearAudio } = useMediaRecorder();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editMessage) {
      setText(editMessage.content);
    } else {
      setText('');
    }
  }, [editMessage]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    // Typing indicator logic
    if (!typingRef.current) {
      typingRef.current = true;
      onTypingStart();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingRef.current = false;
      onTypingStop();
    }, 2000);
  }, [onTypingStart, onTypingStop]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');

    // Stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingRef.current = false;
    onTypingStop();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
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
        const isImage = file.type.startsWith('image/');
        onSend(data.url, isImage ? 'image' : 'file');
      }
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadVoiceMessage = useCallback(async (blob: Blob) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', blob, 'voice.webm');

      const res = await fetch('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        onSend(data.url, 'voice');
      }
    } catch (err) {
      console.error('Voice upload failed', err);
    } finally {
      setIsUploading(false);
      clearAudio();
    }
  }, [onSend, clearAudio]);

  useEffect(() => {
    if (audioBlob && !isUploading) {
      uploadVoiceMessage(audioBlob);
    }
  }, [audioBlob, isUploading, uploadVoiceMessage]);

  const hasText = text.trim().length > 0;

  if (isRecording) {
    return (
      <div className="px-3 py-2.5 shrink-0 flex items-center justify-between" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-500 text-sm font-medium">Recording voice...</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={cancelRecording} className="p-2 shrink-0 cursor-pointer transition-colors text-gray-400 hover:text-white rounded-full">
            <X size={22} />
          </button>
          <button type="button" onClick={stopRecording} className="p-2 shrink-0 cursor-pointer transition-colors text-blue-400 hover:bg-blue-500/20 rounded-full">
            <Send size={22} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 shrink-0" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button type="button" className="p-2 shrink-0 cursor-pointer transition-colors" style={{ color: 'var(--text-tertiary)' }}>
          <Smile size={22} />
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className={`p-2 shrink-0 cursor-pointer transition-colors ${isUploading ? 'opacity-50' : ''}`} style={{ color: 'var(--text-tertiary)' }}>
          <Paperclip size={22} />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        <div className="flex-1 flex items-center px-4 py-2.5" style={{ background: 'var(--bg-input)', borderRadius: '9999px' }}>
          <input
            type="text"
            value={text}
            onChange={handleChange}
            placeholder={editMessage ? "Edit message..." : "Message"}
            className="flex-1 text-sm text-white placeholder-[var(--text-tertiary)] outline-none bg-transparent"
          />
          {editMessage && (
            <button type="button" onClick={onCancelEdit} className="ml-2 text-gray-400 hover:text-white" title="Cancel Edit">
              <X size={16} />
            </button>
          )}
        </div>

        {hasText ? (
          <button
            type="submit"
            className="p-2.5 shrink-0 cursor-pointer transition-all active:scale-90 rounded-full"
            style={{ color: 'var(--accent-blue)' }}
          >
            <Send size={22} />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="p-2.5 shrink-0 cursor-pointer transition-colors rounded-full"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Mic size={22} />
          </button>
        )}
      </form>
    </div>
  );
}
