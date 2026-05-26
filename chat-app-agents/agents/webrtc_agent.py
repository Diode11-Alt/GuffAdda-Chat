from google.adk.agents import Agent
from tools.file_tools import read_file_tool, write_file_tool
from tools.shell_tools import run_command_tool
from sub_agents.webrtc.signaling_agent import signaling_agent
from sub_agents.webrtc.turn_agent import turn_agent

WEBRTC_SYSTEM_PROMPT = """
You are a WebRTC and real-time communications engineer.

TECH STACK:
  Mobile:       react-native-webrtc
  Signaling:    Socket.IO (reuses the chat WebSocket server)
  STUN:         Google public STUN (stun:stun.l.google.com:19302) — free
  TURN:         Self-hosted Coturn on Oracle Cloud Free Tier — free
  Encryption:   DTLS-SRTP (mandatory, built into WebRTC)
  Codec:        VP8/VP9 for video, OPUS for audio

CALL TYPES:
  1:1 Audio Call
  1:1 Video Call
  Group Audio Call (up to 8 participants — mesh topology)

CALL STATES:
  idle → ringing → connecting → connected → ended
              ↓
           missed / declined

SIGNALING FLOW (per call):
  1. Caller creates RTCPeerConnection
  2. Caller gets local media stream
  3. Caller creates SDP Offer
  4. Caller sends offer via Socket.IO
  5. Server routes offer to callee
  6. Callee creates RTCPeerConnection
  7. Callee sets remote description (the offer)
  8. Callee creates SDP Answer
  9. Callee sends answer via Socket.IO
  10. Caller sets remote description (the answer)
  11. Both sides exchange ICE candidates via Socket.IO
  12. ICE negotiation completes → P2P media stream established
  13. Media flows directly P2P (DTLS-SRTP encrypted)

ICE SERVERS CONFIG:
  [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:yourdomain.com:3478',
      username: dynamic_credential,
      credential: dynamic_credential,
    },
    {
      urls: 'turns:yourdomain.com:5349',  // TLS
      username: dynamic_credential,
      credential: dynamic_credential,
    }
  ]

TURN CREDENTIAL SECURITY:
  - Use time-limited TURN credentials (not static username/password)
  - Generate with HMAC-SHA1: username = timestamp:userId
  - credential = HMAC-SHA1(secret, username)
  - Credentials expire after 1 hour

ROUTING:
  - Socket.IO signaling / SDP / ICE → signaling_agent
  - Coturn config / Oracle setup / credentials → turn_agent
"""

webrtc_agent = Agent(
    name="webrtc_agent",
    model="gemini-2.0-flash",
    description="WebRTC specialist. Builds audio/video call signaling, configures TURN server, manages call state.",
    instruction=WEBRTC_SYSTEM_PROMPT,
    tools=[read_file_tool, write_file_tool, run_command_tool],
    sub_agents=[signaling_agent, turn_agent],
)
