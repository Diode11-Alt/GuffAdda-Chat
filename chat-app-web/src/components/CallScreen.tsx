import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface CallScreenProps {
  socketUrl: string;
  userId: string;
}

export const CallScreen: React.FC<CallScreenProps> = ({ socketUrl, userId }) => {
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string } | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Initialize Socket
    socketRef.current = io(socketUrl, { query: { userId } });

    const socket = socketRef.current;

    const processIceBuffer = async () => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        for (const candidate of iceCandidateBufferRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding buffered ice candidate', e);
          }
        }
        iceCandidateBufferRef.current = [];
      }
    };

    socket.on('incoming-call', async ({ from, offer }) => {
      setIncomingCall({ from });
      // Store the offer to be used when user accepts the call
      peerConnectionRef.current = createPeerConnection(from);
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      await processIceBuffer();
    });

    socket.on('call-accepted', async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceBuffer();
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      } else {
        iceCandidateBufferRef.current.push(candidate);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [socketUrl, userId]);

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setInCall(false);
    setIncomingCall(null);
  };

  const createPeerConnection = (targetUserId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          target: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        console.log('ICE connection state:', pc.iceConnectionState);
        endCall();
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const startCall = async (targetUserId: string) => {
    await startLocalStream();
    setInCall(true);

    const pc = createPeerConnection(targetUserId);
    peerConnectionRef.current = pc;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (socketRef.current) {
      socketRef.current.emit('call-user', {
        target: targetUserId,
        offer,
      });
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !peerConnectionRef.current) return;
    
    await startLocalStream();
    setInCall(true);

    const pc = peerConnectionRef.current;
    
    // Add local tracks to the already created peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (socketRef.current) {
      socketRef.current.emit('accept-call', {
        target: incomingCall.from,
        answer,
      });
    }
    setIncomingCall(null);
  };



  return (
    <div className="flex flex-col items-center p-4 bg-[#0A0A0A] min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-4">Video Call</h2>
      
      <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl">
        <div className="flex-1 bg-[#141414] rounded-2xl overflow-hidden aspect-video relative shadow-lg border border-zinc-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
            You
          </div>
        </div>

        <div className="flex-1 bg-[#141414] rounded-2xl overflow-hidden aspect-video relative shadow-lg border border-zinc-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
            Remote Peer
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        {!inCall && (
          <button
            onClick={() => startCall('some-target-id')}
            className="px-6 py-3 bg-[#6366F1] hover:bg-[#6366F1]/90 rounded-lg font-semibold transition-colors"
          >
            Start Call
          </button>
        )}
        
        {incomingCall && !inCall && (
          <div className="flex gap-2 items-center bg-[#141414] p-3 rounded-lg border border-zinc-800">
            <span>Incoming call from {incomingCall.from}</span>
            <button
              onClick={acceptCall}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full font-semibold transition-colors"
            >
              Accept
            </button>
          </div>
        )}

        {inCall && (
          <button
            onClick={endCall}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default CallScreen;
