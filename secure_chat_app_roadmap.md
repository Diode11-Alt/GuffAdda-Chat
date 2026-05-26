# 🔐 My Own Kura Kani — Complete SDLC Roadmap
> **Zero Cost · End-to-End Encrypted · Audio/Video Calls · File Sharing · Voice Notes**

---

## 📌 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack (100% Free)](#2-tech-stack-100-free)
3. [SDLC — Phase by Phase](#3-sdlc--phase-by-phase)
   - Phase 1: Planning
   - Phase 2: Requirements
   - Phase 3: System Design
   - Phase 4: Development
   - Phase 5: Testing
   - Phase 6: Deployment
   - Phase 7: Maintenance
4. [Security Architecture (Deep Dive)](#4-security-architecture-deep-dive)
5. [Feature Breakdown](#5-feature-breakdown)
6. [Database Schema](#6-database-schema)
7. [API Design](#7-api-design)
8. [WebRTC Call Architecture](#8-webrtc-call-architecture)
9. [Full Roadmap Timeline](#9-full-roadmap-timeline)
10. [Folder Structure](#10-folder-structure)
11. [Free Hosting & Infrastructure](#11-free-hosting--infrastructure)
12. [Milestones & Checkpoints](#12-milestones--checkpoints)

---

## 1. Project Overview

### What Are We Building?
A **private, self-hosted, end-to-end encrypted messaging application** — like WhatsApp but fully owned by you, with:
- 💬 Text messaging (individual + group)
- 🎙️ Voice notes / audio messages
- 📞 Audio & Video calls (1:1 and group)
- 📁 File, photo, video, document sharing
- 🔐 End-to-End Encryption (E2EE)
- 🔔 Push notifications
- ✅ Message delivery receipts (sent / delivered / read)
- 🟢 Online/Offline presence

### Core Security Goals
| Goal | Mechanism |
|------|-----------|
| No one can read your messages | End-to-End Encryption (Signal Protocol) |
| No data leaks on server | Server stores only encrypted blobs |
| Identity verification | Public/Private key pairs per user |
| Safe file transfer | Encrypted at source, decrypted at destination |
| Safe calls | DTLS-SRTP for all WebRTC media |
| No unauthorized access | JWT + refresh tokens + device fingerprinting |
| Brute-force protection | Rate limiting + CAPTCHA + account lockout |

---

## 2. Tech Stack (100% Free)

### Frontend (Mobile App)
| Layer | Technology | Why Free |
|-------|-----------|----------|
| Framework | **React Native** (Expo) | Open source |
| Language | TypeScript | Open source |
| State Management | Zustand | Open source |
| Encryption library | `libsodium-wrappers` | Open source |
| WebRTC | `react-native-webrtc` | Open source |
| Push Notifications | Expo Notifications + Firebase FCM | FCM free tier |
| UI Components | NativeBase / React Native Paper | Open source |
| Audio Recording | `expo-av` | Open source |
| File Picker | `expo-document-picker` | Open source |

### Backend
| Layer | Technology | Why Free |
|-------|-----------|----------|
| Runtime | **Node.js** | Open source |
| Framework | **Fastify** (faster than Express) | Open source |
| WebSocket | Socket.IO | Open source |
| Signaling (calls) | Custom WebSocket server | Open source |
| TURN/STUN Server | **Coturn** (self-hosted) | Open source |
| Job Queue | BullMQ + Redis | Open source |
| Authentication | JWT + bcrypt | Open source |

### Database & Storage
| Component | Technology | Free Tier |
|-----------|-----------|-----------|
| Primary DB | **PostgreSQL** | Free on Railway/Supabase |
| Cache / Sessions | **Redis** | Free on Railway/Upstash |
| File Storage | **Supabase Storage** or MinIO (self-hosted) | 1GB free on Supabase |
| Search | PostgreSQL Full-Text Search | Built-in |

### DevOps / Infrastructure (All Free)
| Service | Provider | Free Limit |
|---------|---------|-----------|
| Backend Hosting | **Railway.app** | $5 credit/month (free) |
| Database | **Supabase** | 500MB free |
| File CDN | Supabase Storage | 1GB free |
| CI/CD | **GitHub Actions** | 2000 min/month free |
| Code Repo | **GitHub** | Unlimited free |
| Monitoring | **Grafana Cloud** | Free tier |
| TURN Server | Self-hosted on Oracle Cloud Free Tier | Always free (ARM instance) |
| Domain | Freenom or GitHub Pages subdomain | Free |
| SSL/TLS | Let's Encrypt | Always free |

---

## 3. SDLC — Phase by Phase

---

### 📋 PHASE 1: PLANNING
**Duration: Week 1–2**

#### 1.1 Define Scope
- [ ] Who are the users? (Personal use / small group / family)
- [ ] Max concurrent users? (design for 100 initially)
- [ ] Self-hosted or cloud?
- [ ] Mobile only or web + mobile?

#### 1.2 Risk Analysis
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Security breach | Critical | E2EE, pen testing |
| Key loss = data loss | High | Key backup with passphrase |
| Server downtime | Medium | Health checks, auto-restart |
| TURN server cost | Low | Oracle Cloud free tier |
| Media storage full | Medium | Compression + limits |

#### 1.3 Tools Setup
- GitHub repo (private) → `my-chat-app`
- Project board (GitHub Projects — free)
- Figma (free tier) for UI wireframes
- Notion / Obsidian for documentation

---

### 📄 PHASE 2: REQUIREMENTS
**Duration: Week 2–3**

#### 2.1 Functional Requirements

**Authentication System**
- FR-01: User registration with phone number or email
- FR-02: OTP verification (Twilio free tier or email OTP)
- FR-03: Login with biometric (Face/Fingerprint) on mobile
- FR-04: Multi-device support (link up to 4 devices)
- FR-05: Logout from all devices remotely

**Messaging**
- FR-06: Send/receive text messages
- FR-07: Send/receive voice notes (up to 5 min)
- FR-08: Send photos (JPEG/PNG, max 10MB)
- FR-09: Send videos (MP4, max 50MB)
- FR-10: Send documents (PDF, DOC, etc., max 20MB)
- FR-11: Message status: ⏱ Sending → ✓ Sent → ✓✓ Delivered → ✓✓ Read (blue)
- FR-12: Delete message for me / for everyone
- FR-13: Reply to specific message (threaded reply)
- FR-14: React to message with emoji
- FR-15: Forward message
- FR-16: Star / bookmark messages
- FR-17: Message search

**Group Chat**
- FR-18: Create group (up to 256 members)
- FR-19: Group admin roles
- FR-20: Group invite link

**Calls**
- FR-21: 1:1 audio call
- FR-22: 1:1 video call
- FR-23: Group audio call (up to 8 people)
- FR-24: Call history log
- FR-25: Mute/unmute, camera on/off during call

**Privacy & Security**
- FR-26: End-to-end encryption for all messages
- FR-27: Disappearing messages (configurable timer)
- FR-28: Block/unblock user
- FR-29: Report user
- FR-30: Last seen visibility control

#### 2.2 Non-Functional Requirements
- NFR-01: Message delivery < 200ms on same network
- NFR-02: App startup < 2 seconds
- NFR-03: Support 100 concurrent WebSocket connections (free tier)
- NFR-04: 99.5% uptime
- NFR-05: All stored data encrypted at rest
- NFR-06: GDPR compliant (user data deletion on request)
- NFR-07: App size < 50MB

---

### 🏗️ PHASE 3: SYSTEM DESIGN
**Duration: Week 3–5**

#### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                           │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  React Native │    │  Key Store   │    │  Local DB     │  │
│  │  (Expo)       │    │  (Keychain)  │    │  (SQLite)     │  │
│  └──────┬───────┘    └──────────────┘    └───────────────┘  │
│         │  E2EE Encryption happens HERE                      │
└─────────┼───────────────────────────────────────────────────┘
          │ HTTPS / WSS (TLS 1.3)
┌─────────▼───────────────────────────────────────────────────┐
│                        SERVER SIDE                           │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │  API Server  │   │ Socket.IO    │   │  TURN/STUN Server│  │
│  │  (Fastify)   │   │ (Signaling)  │   │  (Coturn)        │  │
│  └──────┬──────┘   └──────┬───────┘   └──────────────────┘  │
│         │                 │                                   │
│  ┌──────▼──────┐   ┌──────▼───────┐   ┌──────────────────┐  │
│  │  PostgreSQL  │   │  Redis Cache │   │  File Storage    │  │
│  │  (Encrypted) │   │  (Sessions)  │   │  (Supabase/MinIO)│  │
│  └─────────────┘   └──────────────┘   └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2 Encryption Flow (Signal Protocol Simplified)

```
REGISTRATION:
User A generates:
  ├── Identity Key Pair (IK)        → long-term identity
  ├── Signed Pre-Key (SPK)          → rotated periodically
  └── One-Time Pre-Keys (OPK)       → used once each

User A uploads PUBLIC keys to server.
Private keys NEVER leave the device.

FIRST MESSAGE (X3DH Key Agreement):
User A wants to message User B:
  1. A fetches B's public keys from server
  2. A performs X3DH calculation → shared secret S
  3. A derives encryption key from S
  4. A encrypts message with this key
  5. Server stores: [encrypted blob] only
  6. B receives encrypted blob
  7. B performs same X3DH → same shared secret S
  8. B decrypts message

Server NEVER has the key → cannot read messages.
```

#### 3.3 WebRTC Call Flow

```
Caller (A)                    Signal Server              Callee (B)
    |                               |                        |
    |── CALL REQUEST (offer) ──────►|                        |
    |                               |── NOTIFY B ───────────►|
    |                               |                        |── RING
    |                               |◄── ANSWER (accept) ────|
    |◄── ANSWER ────────────────────|                        |
    |                               |                        |
    |══ ICE CANDIDATES EXCHANGE (via Signal Server) ════════►|
    |                               |                        |
    |◄══════════ DIRECT P2P MEDIA STREAM (DTLS-SRTP) ═══════►|
    |           (bypasses server after connection)            |
```

---

### 💻 PHASE 4: DEVELOPMENT
**Duration: Week 5–20**

#### Sprint Structure (2-week sprints)

---

**🚀 Sprint 1 (Week 5–6): Foundation**
- [ ] Initialize React Native (Expo) project with TypeScript
- [ ] Set up Node.js/Fastify backend
- [ ] Configure PostgreSQL + Redis
- [ ] Set up GitHub Actions CI/CD
- [ ] Implement user registration + email OTP
- [ ] JWT authentication with refresh tokens
- [ ] Basic user profile (name, avatar)

**Deliverable:** User can register, login, see profile.

---

**🔐 Sprint 2 (Week 7–8): E2EE Core**
- [ ] Integrate `libsodium-wrappers` on frontend
- [ ] Generate key pairs on registration
- [ ] Implement X3DH key agreement
- [ ] Implement Double Ratchet for forward secrecy
- [ ] Secure key storage using device Keychain
- [ ] Key upload to server (public keys only)

**Deliverable:** Keys generated, stored securely, ready for encrypted messaging.

---

**💬 Sprint 3 (Week 9–10): Text Messaging**
- [ ] Real-time WebSocket connection (Socket.IO)
- [ ] Send/receive encrypted text messages
- [ ] Message persistence in SQLite (local) + PostgreSQL (server)
- [ ] Message status (sent/delivered/read)
- [ ] Conversation list screen
- [ ] Chat screen UI with message bubbles
- [ ] Offline message queue (messages delivered when user comes online)

**Deliverable:** Full encrypted text chat working.

---

**🎙️ Sprint 4 (Week 11–12): Media Messaging**
- [ ] Voice note recording (`expo-av`)
- [ ] Audio message playback with waveform
- [ ] Photo capture + gallery picker
- [ ] Video recording + picker
- [ ] Document picker
- [ ] Client-side encryption before upload
- [ ] Upload to Supabase Storage (encrypted blob)
- [ ] Download + decrypt on receiver side
- [ ] Progress indicators for uploads/downloads
- [ ] Media compression before send

**Deliverable:** Voice notes, photos, videos, documents working end-to-end encrypted.

---

**📞 Sprint 5 (Week 13–14): Audio & Video Calls**
- [ ] Set up Coturn TURN server on Oracle Cloud
- [ ] WebRTC signaling via Socket.IO
- [ ] 1:1 audio call with DTLS-SRTP
- [ ] 1:1 video call
- [ ] In-call UI (mute, video toggle, end call, flip camera)
- [ ] Call notifications (incoming call screen)
- [ ] Call history log
- [ ] Group audio call (up to 8 participants)

**Deliverable:** Encrypted audio & video calls working.

---

**👥 Sprint 6 (Week 15–16): Groups & Advanced Features**
- [ ] Create/manage groups
- [ ] Group messaging (E2EE using Sender Keys)
- [ ] Group calls
- [ ] Message reactions (emoji)
- [ ] Reply to message (quoted reply)
- [ ] Forward message
- [ ] Delete message for everyone
- [ ] Disappearing messages
- [ ] Online/offline presence indicator

**Deliverable:** Groups, reactions, replies, disappearing messages.

---

**🔔 Sprint 7 (Week 17–18): Notifications & Polish**
- [ ] Push notifications (Firebase FCM — free)
- [ ] Background message sync
- [ ] Notification for calls (even when app is closed)
- [ ] Message search
- [ ] Contact sync
- [ ] App settings (privacy, notifications, storage)
- [ ] Block/unblock user
- [ ] Dark mode

**Deliverable:** Full-featured app, polished UI.

---

**🔒 Sprint 8 (Week 19–20): Security Hardening**
- [ ] Certificate pinning (prevent MITM attacks)
- [ ] Root/jailbreak detection
- [ ] Screenshot prevention on sensitive screens
- [ ] Brute-force protection (rate limiting)
- [ ] Session management (list active sessions, revoke)
- [ ] Secure backup (encrypted with user passphrase)
- [ ] Penetration testing
- [ ] Dependency audit (`npm audit`)

**Deliverable:** Production-ready secure application.

---

### 🧪 PHASE 5: TESTING
**Duration: Week 18–21 (parallel with dev)**

#### 5.1 Testing Pyramid

```
                    ┌──────────┐
                    │  E2E     │  ← Detox (React Native)
                   /│  Tests   │\
                  / └──────────┘ \
                 /  ┌──────────┐  \
                /   │Integration│  \
               /    │  Tests   │   \
              /     └──────────┘    \
             /    ┌──────────────┐   \
            /     │  Unit Tests  │    \
           /──────┴──────────────┴─────\
          (Jest + React Testing Library)
```

#### 5.2 Unit Tests (Jest)
```
- Encryption/Decryption functions
- Key generation
- Message serialization/deserialization
- Auth token validation
- API request/response handlers
- State management logic
Target: 80%+ code coverage
```

#### 5.3 Integration Tests
```
- User registration → login → send message flow
- File upload → encrypt → store → download → decrypt
- WebSocket connection → message delivery → status update
- Call initiation → ICE negotiation → media stream
```

#### 5.4 End-to-End Tests (Detox)
```
- Full registration flow
- Send text message between two devices
- Send voice note
- Make audio call
- Group creation and messaging
```

#### 5.5 Security Testing
```
- OWASP Mobile Top 10 checklist
- Man-in-the-Middle (MITM) attempt
- SQL injection on API endpoints
- JWT token tampering
- Replay attack on messages
- Brute-force login attempt
- Check if server can decrypt messages (should fail)
- Memory inspection for key leakage
```

#### 5.6 Performance Testing
```
Tool: k6 (free, open source)
Tests:
  - 100 concurrent WebSocket connections
  - Message throughput: 1000 messages/minute
  - File upload: 10MB file upload time
  - API response time < 100ms (p95)
```

---

### 🚀 PHASE 6: DEPLOYMENT
**Duration: Week 21–22**

#### 6.1 Backend Deployment (Railway — Free)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init

# 4. Add PostgreSQL
railway add postgresql

# 5. Add Redis
railway add redis

# 6. Deploy
railway up
```

#### 6.2 TURN Server (Oracle Cloud Free Tier — Always Free)

```bash
# Oracle Cloud Always Free: 1x ARM instance (4 CPU, 24GB RAM)
# Install Coturn
sudo apt install coturn

# /etc/turnserver.conf
listening-port=3478
tls-listening-port=5349
listening-ip=YOUR_SERVER_IP
external-ip=YOUR_PUBLIC_IP
realm=yourdomain.com
server-name=yourdomain.com
lt-cred-mech
user=chatapp:securepassword
cert=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
pkey=/etc/letsencrypt/live/yourdomain.com/privkey.pem
log-file=/var/log/turnserver.log
```

#### 6.3 SSL/TLS (Let's Encrypt — Free)

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
# Auto-renews every 90 days
```

#### 6.4 Mobile App Distribution

**For testing (free):**
- Android: `.apk` direct install or Firebase App Distribution (free)
- iOS: TestFlight (requires $99/year Apple Developer account) OR use Expo Go for testing

**For production (free on Android):**
- Google Play Store: one-time $25 fee
- F-Droid: completely free (open source store)
- Direct APK: host on GitHub Releases (free)

#### 6.5 Environment Variables

```env
# .env (NEVER commit to git)
DATABASE_URL=postgresql://user:pass@host:5432/chatdb
REDIS_URL=redis://default:pass@host:6379
JWT_SECRET=your-256-bit-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
TURN_SERVER=turn:yourdomain.com:3478
TURN_USERNAME=chatapp
TURN_PASSWORD=securepassword
FCM_SERVER_KEY=your-firebase-key
```

---

### 🔧 PHASE 7: MAINTENANCE
**Ongoing after launch**

#### 7.1 Monitoring (Free Tools)
```
- Grafana Cloud (free tier): metrics dashboards
- Railway built-in logs: server logs
- Sentry (free tier, 5000 errors/month): crash reporting
- UptimeRobot (free): uptime monitoring, alerts
```

#### 7.2 Key Rotation Policy
```
- Signed Pre-Keys: rotate every 7 days
- One-Time Pre-Keys: replenish when < 10 remaining
- User sessions: expire after 30 days inactivity
- JWT access tokens: expire after 15 minutes
- JWT refresh tokens: expire after 30 days
```

#### 7.3 Backup Strategy
```
- PostgreSQL: automated daily backup (Railway does this free)
- Files: Supabase handles redundancy
- User keys: user-controlled encrypted backup
- Code: GitHub (always current)
```

#### 7.4 Update Process
```
1. Feature branch → PR → Code review
2. GitHub Actions runs: lint → unit tests → integration tests
3. PR merged to main → auto-deploy to Railway
4. Monitor for 30 min after deploy
5. Roll back if error rate spikes
```

---

## 4. Security Architecture (Deep Dive)

### 4.1 Threat Model

| Threat Actor | Attack Vector | Defense |
|-------------|--------------|---------|
| Curious server admin | Read DB | E2EE — server only has ciphertext |
| Network attacker (MITM) | Intercept traffic | TLS 1.3 + Certificate Pinning |
| Stolen device | Physical access to phone | Device Keychain + biometric lock |
| Stolen JWT token | API replay attack | Short expiry (15min) + refresh rotation |
| Brute force login | Password guessing | Rate limit + lockout + bcrypt(12 rounds) |
| Malicious server (fake keys) | Key substitution | Key verification / safety numbers |
| Replay attack | Resend old messages | Message counter in Double Ratchet |
| Malicious APK | Fake app install | Code signing + verification |

### 4.2 Encryption Layers

```
Layer 1 — Transport:  TLS 1.3 (HTTPS/WSS)
  └── Protects: all data in transit

Layer 2 — Application: End-to-End Encryption (Signal Protocol)
  ├── Key Exchange: X3DH (Extended Triple Diffie-Hellman)
  ├── Session Keys: Double Ratchet Algorithm
  ├── Cipher: AES-256-GCM
  └── MAC: HMAC-SHA256
  └── Protects: message content (server cannot read)

Layer 3 — Storage: Encrypted at Rest
  ├── Server DB: PostgreSQL with encryption at rest
  ├── File Storage: AES-256 encrypted before upload
  ├── Client DB: SQLite with SQLCipher
  └── Keys: iOS Keychain / Android Keystore (hardware-backed)

Layer 4 — Media Calls: DTLS-SRTP
  └── Protects: all audio/video call media
```

### 4.3 Key Management

```
┌─────────────────────────────────────────────────────┐
│                   USER'S DEVICE                      │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │           Secure Enclave / Keystore          │     │
│  │  ┌──────────────┐  ┌─────────────────────┐  │     │
│  │  │ Identity Key  │  │  Signed Pre-Key     │  │     │
│  │  │ (never leaves)│  │  (rotated weekly)   │  │     │
│  │  └──────────────┘  └─────────────────────┘  │     │
│  │  ┌──────────────────────────────────────┐    │     │
│  │  │  One-Time Pre-Keys (50 pre-generated) │    │     │
│  │  └──────────────────────────────────────┘    │     │
│  └─────────────────────────────────────────────┘     │
│                         │                             │
│                         │ Upload PUBLIC keys only     │
│                         ▼                             │
│              ┌───────────────────┐                   │
│              │    Server         │                   │
│              │ (Public keys only)│                   │
│              └───────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

### 4.4 Safety Numbers (Key Verification)
```
Each conversation has a unique "Safety Number" (like WhatsApp's security code)
- Derived from both users' identity keys
- Users can compare this number in person or via another channel
- If numbers match → no MITM → communication is secure
- Show as: 60-digit number OR QR code
```

---

## 5. Feature Breakdown

### 5.1 Message Types & Encryption

```typescript
interface Message {
  id: string;                    // UUID
  conversationId: string;
  senderId: string;
  type: 'text' | 'voice' | 'image' | 'video' | 'document' | 'call';
  // On server — always encrypted:
  encryptedPayload: string;      // base64 ciphertext
  iv: string;                    // initialization vector
  // Metadata (not encrypted — needed for routing):
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyToId?: string;
  isDeleted: boolean;
  disappearsAt?: number;         // Unix timestamp
}
```

### 5.2 File Sharing Flow

```
1. User selects file
2. App generates random AES-256 key (per file)
3. App encrypts file locally
4. App uploads encrypted blob to Supabase Storage
5. App sends message containing:
   - Encrypted file key (using conversation's E2EE)
   - File URL
   - File metadata (name, size, type)
6. Receiver gets message
7. Receiver decrypts file key
8. Receiver downloads encrypted blob
9. Receiver decrypts file locally
10. File displayed/played
```

### 5.3 Voice Notes Flow

```
1. User holds "record" button
2. expo-av records audio (AAC format)
3. File saved temporarily to local storage
4. On release: encryption → upload → send message
5. Receiver: download → decrypt → play with waveform
6. Temporary file deleted after send
```

### 5.4 Disappearing Messages

```
Configuration options: 24 hours | 7 days | 90 days | off
Implementation:
  - Timer starts when message is READ (not sent)
  - Stored in message.disappearsAt field
  - Background job checks every minute and deletes
  - Deleted from: local SQLite + server + media storage
```

---

## 6. Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  about TEXT DEFAULT 'Hey there! I am using this app.',
  identity_public_key TEXT NOT NULL,       -- X25519 public key
  signed_prekey_public TEXT NOT NULL,
  signed_prekey_signature TEXT NOT NULL,
  registration_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- One-Time Pre-Keys (uploaded in batches)
CREATE TABLE one_time_prekeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_id INTEGER NOT NULL,
  public_key TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('direct', 'group')),
  name VARCHAR(100),                        -- for groups
  avatar_url TEXT,                          -- for groups
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disappearing_messages_timer INTEGER       -- seconds, null = off
);

-- Conversation Members
CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages (server stores only encrypted content)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  message_type VARCHAR(20) NOT NULL,        -- text/voice/image/video/document/call
  encrypted_payload TEXT NOT NULL,          -- ciphertext (server cannot read)
  iv TEXT NOT NULL,                         -- initialization vector
  reply_to_id UUID REFERENCES messages(id),
  is_deleted BOOLEAN DEFAULT false,
  deleted_for_everyone_at TIMESTAMP WITH TIME ZONE,
  disappears_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_messages_conversation (conversation_id, created_at DESC)
);

-- Message Delivery Status
CREATE TABLE message_status (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'sent' CHECK (status IN ('sent','delivered','read')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- Call Records
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  initiator_id UUID REFERENCES users(id),
  call_type VARCHAR(10) CHECK (call_type IN ('audio', 'video')),
  status VARCHAR(20) CHECK (status IN ('initiated','ringing','ongoing','ended','missed','declined')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- Sessions / Devices
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(100),
  device_fingerprint TEXT NOT NULL,
  fcm_token TEXT,                           -- push notification token
  refresh_token_hash TEXT NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Reactions
CREATE TABLE message_reactions (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);
```

---

## 7. API Design

### Base URL: `https://api.yourchatapp.com/v1`

### Authentication Endpoints
```
POST /auth/register          → Register with phone/email
POST /auth/verify-otp        → Verify OTP code
POST /auth/login             → Login, get JWT
POST /auth/refresh           → Refresh access token
POST /auth/logout            → Revoke session
GET  /auth/sessions          → List active sessions
DELETE /auth/sessions/:id    → Revoke specific session
```

### User Endpoints
```
GET  /users/me               → Get own profile
PUT  /users/me               → Update profile
GET  /users/:id              → Get user's public info + public keys
GET  /users/search?q=        → Search users by name/phone
POST /users/:id/block        → Block user
DELETE /users/:id/block      → Unblock user
```

### Key Exchange Endpoints
```
POST /keys/prekeys            → Upload batch of one-time pre-keys
GET  /keys/:userId            → Get user's public keys for E2EE
GET  /keys/prekey-count       → Check how many pre-keys remain
```

### Message Endpoints
```
GET  /conversations           → List conversations
POST /conversations           → Create conversation
GET  /conversations/:id/messages  → Get message history (paginated)
POST /conversations/:id/messages  → Send message
DELETE /messages/:id          → Delete message (for me)
DELETE /messages/:id/everyone → Delete message for everyone
POST /messages/:id/react      → Add reaction
```

### Call Endpoints
```
POST /calls/initiate          → Start a call (get TURN credentials)
POST /calls/:id/accept        → Accept call
POST /calls/:id/decline       → Decline call
POST /calls/:id/end           → End call
GET  /calls/history           → Call history
```

### File Endpoints
```
POST /files/upload-url        → Get pre-signed upload URL
GET  /files/:id               → Get pre-signed download URL
DELETE /files/:id             → Delete file
```

### WebSocket Events (Socket.IO)
```javascript
// Client → Server
'message:send'          → Send encrypted message
'message:status'        → Update delivery/read status
'call:offer'            → WebRTC offer SDP
'call:answer'           → WebRTC answer SDP
'call:ice-candidate'    → ICE candidate
'call:end'              → End call
'typing:start'          → User started typing
'typing:stop'           → User stopped typing
'presence:update'       → Online/offline

// Server → Client
'message:new'           → New message received
'message:status:update' → Message status changed
'call:incoming'         → Incoming call
'call:offer'            → WebRTC offer from caller
'call:answer'           → WebRTC answer from callee
'call:ice-candidate'    → ICE candidate from peer
'call:ended'            → Call was ended
'user:typing'           → Someone is typing
'user:presence'         → Contact online/offline
```

---

## 8. WebRTC Call Architecture

### 8.1 ICE Server Configuration

```javascript
const iceServers = [
  // Free STUN servers (Google)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Your own TURN server (Oracle Cloud free)
  {
    urls: 'turn:yourdomain.com:3478',
    username: 'chatapp',
    credential: 'securepassword'
  },
  {
    urls: 'turns:yourdomain.com:5349',  // TURN over TLS
    username: 'chatapp',
    credential: 'securepassword'
  }
];
```

### 8.2 Call Setup Code Outline

```typescript
// Caller side
const pc = new RTCPeerConnection({ iceServers });
const stream = await mediaDevices.getUserMedia({ audio: true, video: true });
stream.getTracks().forEach(track => pc.addTrack(track, stream));

const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
socket.emit('call:offer', { to: calleeId, sdp: offer });

// Handle ICE candidates
pc.onicecandidate = ({ candidate }) => {
  if (candidate) socket.emit('call:ice-candidate', { to: calleeId, candidate });
};

// Callee side
socket.on('call:offer', async ({ from, sdp }) => {
  const pc = new RTCPeerConnection({ iceServers });
  await pc.setRemoteDescription(sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('call:answer', { to: from, sdp: answer });
});
```

---

## 9. Full Roadmap Timeline

```
MONTH 1 (Weeks 1–4):   Planning + Requirements + System Design
  ├── Week 1–2:  Scope, risks, tools setup
  ├── Week 2–3:  Full requirements doc
  └── Week 3–5:  Architecture design, DB schema, API design

MONTH 2 (Weeks 5–8):   Core Foundation + Encryption
  ├── Week 5–6:  Project setup + Auth system
  └── Week 7–8:  E2EE implementation (Signal Protocol)

MONTH 3 (Weeks 9–12):  Messaging + Media
  ├── Week 9–10: Text messaging (real-time)
  └── Week 11–12: Voice notes + files + photos + videos

MONTH 4 (Weeks 13–16): Calls + Groups
  ├── Week 13–14: Audio & Video calls (WebRTC)
  └── Week 15–16: Groups + advanced features

MONTH 5 (Weeks 17–20): Polish + Security Hardening
  ├── Week 17–18: Notifications + UI polish
  └── Week 19–20: Security audit + penetration testing

MONTH 6 (Weeks 21–24): Testing + Deployment + Launch
  ├── Week 21–22: Full testing + bug fixes
  ├── Week 23:    Deployment + monitoring setup
  └── Week 24:    Launch 🎉

ONGOING: Maintenance, updates, feature additions
```

---

## 10. Folder Structure

```
my-chat-app/
├── apps/
│   └── mobile/                      # React Native (Expo)
│       ├── src/
│       │   ├── screens/
│       │   │   ├── Auth/            # Login, Register, OTP
│       │   │   ├── Chat/            # Conversation list, Chat view
│       │   │   ├── Call/            # Audio/Video call screens
│       │   │   ├── Profile/         # User profile, settings
│       │   │   └── Groups/          # Group management
│       │   ├── components/          # Reusable UI components
│       │   │   ├── MessageBubble/
│       │   │   ├── VoiceNotePlayer/
│       │   │   ├── MediaMessage/
│       │   │   └── CallUI/
│       │   ├── services/
│       │   │   ├── crypto/          # Encryption/decryption
│       │   │   │   ├── keyManagement.ts
│       │   │   │   ├── x3dh.ts      # Key exchange
│       │   │   │   ├── doubleRatchet.ts
│       │   │   │   └── fileEncryption.ts
│       │   │   ├── api/             # API calls
│       │   │   ├── socket/          # WebSocket handling
│       │   │   ├── webrtc/          # Call logic
│       │   │   ├── storage/         # Local DB (SQLite)
│       │   │   └── notifications/
│       │   ├── store/               # Zustand state
│       │   └── utils/
│       ├── app.json
│       └── package.json
│
├── apps/
│   └── server/                      # Node.js / Fastify
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── users.ts
│       │   │   ├── messages.ts
│       │   │   ├── calls.ts
│       │   │   └── files.ts
│       │   ├── services/
│       │   │   ├── authService.ts
│       │   │   ├── messageService.ts
│       │   │   ├── callService.ts
│       │   │   ├── notificationService.ts
│       │   │   └── storageService.ts
│       │   ├── socket/              # Socket.IO handlers
│       │   ├── middleware/          # Auth, rate limiting
│       │   ├── db/                  # DB queries
│       │   └── utils/
│       ├── migrations/              # DB migrations
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── test.yml                 # Run tests on PR
│       └── deploy.yml               # Deploy on main merge
│
├── docker-compose.yml               # Local dev environment
├── .env.example
└── README.md
```

---

## 11. Free Hosting & Infrastructure

### Monthly Cost Breakdown: $0

| Service | Provider | Free Tier | Usage |
|---------|---------|-----------|-------|
| Backend API | Railway | $5 credit/mo | Fastify server |
| PostgreSQL | Railway/Supabase | 500MB DB | All data |
| Redis | Railway/Upstash | 10,000 req/day | Cache, sessions |
| File Storage | Supabase | 1GB | Encrypted media |
| TURN Server | Oracle Cloud | Always free | WebRTC calls |
| CI/CD | GitHub Actions | 2000 min/mo | Auto deploy |
| Push Notifications | Firebase FCM | Unlimited | Notifications |
| Monitoring | Grafana Cloud | Free tier | Metrics |
| Crash Reporting | Sentry | 5000 err/mo | Bug tracking |
| Uptime Monitoring | UptimeRobot | 50 monitors | Always up |
| SSL Certificate | Let's Encrypt | Always free | HTTPS |
| Domain | Your subdomain | Free | railway.app subdomain |
| **TOTAL** | | **$0/month** | |

---

## 12. Milestones & Checkpoints

### ✅ Milestone 1: Secure Foundation (End of Month 2)
- [ ] Users can register and login
- [ ] Keys generated and stored securely on device
- [ ] E2EE verified: server cannot read message content
- [ ] Basic chat screen (UI only, no backend yet)

### ✅ Milestone 2: Working Messenger (End of Month 3)
- [ ] Two users can exchange encrypted text messages in real-time
- [ ] Can send/receive voice notes, photos, videos, documents
- [ ] Message status (sent/delivered/read) working
- [ ] Offline message delivery (queued and delivered when online)

### ✅ Milestone 3: Calls Working (End of Month 4)
- [ ] 1:1 audio call working with encryption
- [ ] 1:1 video call working
- [ ] Group chat with 10 test users
- [ ] Group audio call

### ✅ Milestone 4: Production Ready (End of Month 5)
- [ ] All features from FR-01 to FR-30 implemented
- [ ] Security audit passed
- [ ] Performance: handles 100 concurrent users
- [ ] Push notifications working (foreground + background)

### ✅ Milestone 5: Launched (End of Month 6)
- [ ] Deployed and accessible
- [ ] APK/IPA distributed to target users
- [ ] Monitoring and alerting active
- [ ] Documentation complete
- [ ] 🎉 You own a fully secure, encrypted chat app!

---

## 🔗 Essential Resources

### Learning
- Signal Protocol: https://signal.org/docs/
- libsodium docs: https://doc.libsodium.org/
- WebRTC for beginners: https://webrtc.org/getting-started/
- React Native: https://reactnative.dev/
- Fastify: https://fastify.dev/

### Tools
- Postman (API testing — free): https://postman.com
- Figma (UI design — free): https://figma.com
- Railway (hosting — free tier): https://railway.app
- Supabase (DB + storage — free): https://supabase.com
- Oracle Cloud Free Tier: https://oracle.com/cloud/free/

### Security Checklists
- OWASP Mobile Top 10: https://owasp.org/www-project-mobile-top-10/
- OWASP API Security: https://owasp.org/www-project-api-security/

---

*Document Version: 1.0 | Created: May 2026 | For personal/educational use*
