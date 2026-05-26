import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile, Mic, X } from 'lucide-react';
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

      const res = await fetch(`http://${window.location.hostname}:3000/api/media/upload`, {
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

      const res = await fetch(`http://${window.location.hostname}:3000/api/media/upload`, {
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
      <div className="px-4 py-2 shrink-0 bg-black flex items-center justify-between">
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
    <div className="px-4 py-2 shrink-0 bg-black">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 flex items-center px-2 py-1.5 min-h-[44px]" style={{ background: 'var(--bg-input)', borderRadius: '22px' }}>
          
          {/* Camera / Attachment - Left inside pill */}
          <div className="flex items-center shrink-0">
            <div className="p-1.5 rounded-full" style={{ background: 'var(--accent-blue)', color: 'white' }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className={`cursor-pointer flex items-center justify-center transition-colors ${isUploading ? 'opacity-50' : ''}`}>
                <svg aria-label="Camera" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18">
                  <path d="M12 17.502a5.502 5.502 0 1 0-5.502-5.502A5.508 5.508 0 0 0 12 17.502Zm0-9.004a3.502 3.502 0 1 1-3.502 3.502A3.506 3.506 0 0 1 12 8.498ZM21.928 6.942h-3.411a2.115 2.115 0 0 1-1.89-1.16l-.837-1.636A1.854 1.854 0 0 0 14.153 3.12h-4.306a1.85 1.85 0 0 0-1.636 1.026l-.837 1.636a2.115 2.115 0 0 1-1.89 1.16H2.072A2.074 2.074 0 0 0 0 9.014v9.914a2.074 2.074 0 0 0 2.072 2.072h19.856A2.074 2.074 0 0 0 24 18.928V9.014a2.074 2.074 0 0 0-2.072-2.072Z"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          {/* Text Input */}
          <input
            type="text"
            value={text}
            onChange={handleChange}
            placeholder={editMessage ? "Edit message..." : "Message..."}
            className="flex-1 min-w-0 text-[15px] text-white placeholder-gray-400 outline-none bg-transparent px-3 py-1.5"
          />

          {editMessage && (
            <button type="button" onClick={onCancelEdit} className="mr-2 text-gray-400 hover:text-white" title="Cancel Edit">
              <X size={16} />
            </button>
          )}

          {/* Right side icons inside pill */}
          {!hasText ? (
            <div className="flex items-center gap-1 shrink-0 px-1">
              <button type="button" onClick={startRecording} className="p-1.5 cursor-pointer text-white">
                <Mic size={22} />
              </button>
              <button type="button" className="p-1.5 cursor-pointer text-white">
                <Smile size={22} />
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="px-4 py-1.5 shrink-0 cursor-pointer text-[15px] font-semibold transition-all"
              style={{ color: 'var(--accent-blue)' }}
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
