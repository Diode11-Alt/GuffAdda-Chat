import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

interface CallState {
  isCalling: boolean;
  isReceivingCall: boolean;
  isCallActive: boolean;
  callType: 'voice' | 'video' | null;
  callerId: string | null;
  conversationId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  initiateCall: (conversationId: string, type: 'voice' | 'video') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
}

const WebRTCContext = createContext<CallState | null>(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callerId, setCallerId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteStream(null);
    setIsCalling(false);
    setIsReceivingCall(false);
    setIsCallActive(false);
    setCallType(null);
    setCallerId(null);
    setConversationId(null);
  };

  const createPeerConnection = (convId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', { conversationId: convId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return pc;
  };

  const setupLocalStream = async (type: 'voice' | 'video') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === 'video',
      audio: true,
    });
    setLocalStream(stream);
    return stream;
  };

  const initiateCall = async (convId: string, type: 'voice' | 'video') => {
    try {
      setConversationId(convId);
      setCallType(type);
      setIsCalling(true);
      
      const stream = await setupLocalStream(type);
      const pc = createPeerConnection(convId);
      peerConnection.current = pc;
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket?.emit('call_initiate', {
        conversationId: convId,
        callType: type,
        offer,
      });
    } catch (err) {
      console.error('Failed to initiate call', err);
      cleanup();
    }
  };

  const acceptCall = async () => {
    if (!conversationId || !callType) return;
    try {
      setIsReceivingCall(false);
      setIsCallActive(true);
      
      const stream = await setupLocalStream(callType);
      
      if (peerConnection.current) {
        stream.getTracks().forEach(track => {
          peerConnection.current?.addTrack(track, stream);
        });
        
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        
        socket?.emit('call_accept', {
          conversationId,
          answer,
        });
      }
    } catch (err) {
      console.error('Failed to accept call', err);
      cleanup();
    }
  };

  const rejectCall = () => {
    if (conversationId) {
      socket?.emit('call_reject', { conversationId });
    }
    cleanup();
  };

  const endCall = () => {
    if (conversationId) {
      socket?.emit('call_end', { conversationId });
    }
    cleanup();
  };

  useEffect(() => {
    if (!socket || !user) return;

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    socket.on('call_incoming', async (data: any) => {
      if (isCallActive || isCalling || isReceivingCall) {
        // Busy
        socket.emit('call_reject', { conversationId: data.conversationId });
        return;
      }
      
      setConversationId(data.conversationId);
      setCallerId(data.callerId);
      setCallType(data.callType);
      setIsReceivingCall(true);

      // Show notification if hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`Incoming ${data.callType} call...`, {
          body: `Click to answer the call`,
          icon: '/vite.svg',
        });
      }
      
      const pc = createPeerConnection(data.conversationId);
      peerConnection.current = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    });

    socket.on('call_accepted', async (data: any) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setIsCalling(false);
        setIsCallActive(true);
      }
    });

    socket.on('call_rejected', () => {
      cleanup();
    });

    socket.on('call_ended', () => {
      cleanup();
    });

    socket.on('ice_candidate', async (data: any) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    return () => {
      socket.off('call_incoming');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
      socket.off('ice_candidate');
    };
  }, [socket, user, isCallActive, isCalling, isReceivingCall]);

  return (
    <WebRTCContext.Provider value={{
      isCalling,
      isReceivingCall,
      isCallActive,
      callType,
      callerId,
      conversationId,
      localStream,
      remoteStream,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall
    }}>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC() {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error('useWebRTC must be used within WebRTCProvider');
  return ctx;
}
