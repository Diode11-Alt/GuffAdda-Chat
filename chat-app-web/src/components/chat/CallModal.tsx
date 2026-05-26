import { useEffect, useRef } from 'react';
import { useWebRTC } from '../../contexts/WebRTCContext';
import { useChat } from '../../contexts/ChatContext';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';

export default function CallModal() {
  const { 
    isCalling, 
    isReceivingCall, 
    isCallActive, 
    callType, 
    callerId,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall
  } = useWebRTC();
  
  const { conversations } = useChat();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCallActive]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isCallActive]);

  if (!isCalling && !isReceivingCall && !isCallActive) return null;

  // Find caller info
  const callerUser = conversations.find(c => c.other_user_id === callerId);
  const callerName = callerUser?.other_user_name || 'Someone';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[var(--bg-secondary)] rounded-2xl overflow-hidden shadow-2xl flex flex-col relative border border-[var(--border-subtle)]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </h3>
          <p className="text-sm text-[var(--text-tertiary)]">
            {isReceivingCall ? 'Incoming...' : isCalling ? 'Calling...' : '00:00'}
          </p>
        </div>

        {/* Video Grid */}
        <div className="relative bg-black flex-1 min-h-[400px] flex items-center justify-center p-4">
          
          {/* Remote Video (Full Size) */}
          {callType === 'video' ? (
            <video 
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover rounded-xl bg-gray-900 ${!isCallActive ? 'hidden' : ''}`}
            />
          ) : (
            <div className={`w-32 h-32 rounded-full bg-blue-500/20 flex items-center justify-center ${!isCallActive ? 'hidden' : ''}`}>
               <Phone size={48} className="text-blue-400" />
            </div>
          )}

          {/* Local Video (PiP) */}
          {callType === 'video' && isCallActive && (
            <div className="absolute bottom-6 right-6 w-32 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
              <video 
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Audio stream mapping (hidden) */}
          {callType === 'voice' && (
            <>
              <audio ref={remoteVideoRef as any} autoPlay />
              <audio ref={localVideoRef as any} autoPlay muted />
            </>
          )}
          
          {/* Calling State */}
          {isCalling && !isCallActive && (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-800 animate-pulse mb-4" />
              <p className="text-white font-medium text-lg">Calling...</p>
            </div>
          )}

          {/* Incoming Call State */}
          {isReceivingCall && (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-800 mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                {callType === 'video' ? <Video size={32} /> : <Phone size={32} />}
              </div>
              <p className="text-white font-medium text-xl">{callerName} is calling</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-6 bg-[var(--bg-secondary)] flex items-center justify-center gap-6">
          
          {isReceivingCall ? (
            <>
              <button 
                onClick={rejectCall}
                className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                <PhoneOff size={24} />
              </button>
              <button 
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 animate-bounce"
              >
                <Phone size={24} />
              </button>
            </>
          ) : (
            <>
              <button className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
                <Mic size={20} />
              </button>
              <button 
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                <PhoneOff size={28} />
              </button>
              {callType === 'video' && (
                <button className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
                  <Video size={20} />
                </button>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
