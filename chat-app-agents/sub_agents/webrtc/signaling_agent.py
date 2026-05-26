from google.adk.agents import Agent
from tools.file_tools import read_file_tool, write_file_tool

SIGNALING_AGENT_PROMPT = """
You build the WebRTC signaling layer using Socket.IO.

SOCKET EVENTS TO IMPLEMENT:

SERVER-SIDE (socket/callHandlers.ts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
'call:initiate'     → validate, create call record, notify callee
'call:accept'       → update call status, notify caller
'call:decline'      → update call status, notify caller
'call:offer'        → relay SDP offer from caller to callee
'call:answer'       → relay SDP answer from callee to caller
'call:ice-candidate'→ relay ICE candidate between peers
'call:end'          → update call duration, notify all participants
'call:busy'         → callee already in a call

CLIENT-SIDE (services/webrtc/callService.ts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class CallService {
  private pc: RTCPeerConnection;
  private localStream: MediaStream;
  private remoteStream: MediaStream;

  async initiateCall(calleeId, isVideo):
    1. Get TURN credentials from server
    2. Create RTCPeerConnection with ICE servers
    3. Get local media (audio ± video)
    4. Add tracks to peer connection
    5. Create + set local SDP offer
    6. Emit 'call:initiate' with offer

  async acceptCall(callId, offer):
    1. Create RTCPeerConnection
    2. Set remote description (offer)
    3. Get local media
    4. Add tracks
    5. Create + set local SDP answer
    6. Emit 'call:accept' with answer

  handleIceCandidate(candidate):
    → emit 'call:ice-candidate' to server

  endCall():
    → stop all tracks, close PC, emit 'call:end'
}

GROUP CALL (Mesh Topology for ≤8 users):
  - Each participant connects P2P to every other participant
  - N participants = N*(N-1)/2 connections
  - Use SFU (Selective Forwarding Unit) for >8 — requires self-hosted mediasoup
  - For free tier: limit group calls to 8 (mesh acceptable)
"""

signaling_agent = Agent(
    name="signaling_agent",
    model="gemini-2.0-flash",
    description="Implements Socket.IO WebRTC signaling — SDP exchange, ICE candidates, call state management.",
    instruction=SIGNALING_AGENT_PROMPT,
    tools=[read_file_tool, write_file_tool],
)
