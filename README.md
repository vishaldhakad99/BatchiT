# BatchiT — Premium Private Social Messaging Platform
> **"Your Moments. Your People. Your Privacy."**

BatchiT is a modern, production-oriented private social communication platform designed from the ground up for genuine intimacy, privacy, and ephemeral media exchange. Combining the spontaneity of camera snaps, the permanence of personal vaults, the immediacy of peer-to-peer WebRTC calling, and the security of client-side End-to-End Encryption (E2EE), BatchiT delivers an independent and premium social experience.

---

## 🚀 Key Features

### 1. Ephemeral Snaps & Camera Studio
- **Live Device Camera**: Real-time camera viewfinder with front/back camera flipping and file picker fallback.
- **Creative Studio**: Drawing tools with color palette, brush sizing, clear/undo, customizable text overlays, and 6 aesthetic color filters (*Normal, Vivid Violet, Cyberpunk, Noir, Warm Sunset, Vintage*).
- **Disappearing Media**: View-once mode or timed viewing (1 to 10 seconds). Snaps expire after 24 hours if unopened and are permanently invalidated once opened.
- **Screenshot Alerting**: Detects screen blur/hidden window triggers and alerts the sender in real-time.

### 2. End-to-End Encrypted (E2EE) Messaging
- **Web Crypto Standard**: Uses the audited W3C Web Crypto API (`window.crypto.subtle`) implementing **ECDH (Curve P-256)** for key exchange and **AES-GCM (256-bit)** for message payload encryption.
- **Zero-Knowledge Server**: Private keys are generated and retained exclusively on the user's client device. The server stores only the ciphertext, initialization vector (IV), and participant IDs.
- **Rich Media**: Voice notes, photos, videos, emoji reactions, reply quotes, message editing, soft deletion, and read receipts (`SENT`, `DELIVERED`, `READ`).
- **Disappearing Messages**: Configurable timer (24h, 7d, 90d) for automatic message purging.

### 3. Real-Time WebRTC Audio & Video Calling
- **Direct P2P Connectivity**: Peer-to-peer audio and video calling powered by WebRTC with STUN/TURN server traversal.
- **Calling Controls**: Live camera preview, remote feed, mute/unmute microphone, camera toggle, synthesized web audio ringtone, call duration timer, and call status history.
- **Socket Signaling**: Low-latency call initiation, offer, answer, and ICE candidate negotiation handled via Socket.IO.

### 4. 24-Hour Stories
- **Visual Stories**: Share photo and video updates that automatically expire after 24 hours.
- **Segmented Progress Bar**: Multi-part story playback with left/right tap navigation.
- **Interaction**: Quick emoji reactions and direct story replies.
- **Audience Isolation**: Publish to All Friends or exclusively to Close Friends (`close_friends`).

### 5. Daily Snap Streaks
- **Streak Calculation**: Server-side streak engine verified with reliable timestamps. Requires both participants to exchange snaps within 24-hour windows.
- **Milestones**: Flame icon (`🔥`) counter, countdown warning before expiration, and streak achievement alerts.

### 6. Memories & Private Vault
- **Personal Archive**: Save personal photos and videos organized by album tags.
- **Private Vault**: High-security partition secured by a 4-digit PIN with separate server-side verification and token isolation.

### 7. Friends & Identity
- **Username Resolution**: Unique username search with privacy protections (no phone/email leakage).
- **QR Code Pairing**: Instant friend adding via personal profile QR codes (`batchit://user/{username}`).
- **Relationship Management**: Send, accept, reject, and cancel requests; block/unblock unwanted contacts.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router v7, Zustand, Axios, Lucide React, Framer Motion, QR Code SVG |
| **Backend** | Node.js (v22), Express.js, Socket.IO (v4), Mongoose (v8), Multer, Pino Logger, Helmet, CORS, Express Rate Limit |
| **Database** | MongoDB Atlas / Local MongoDB v8.2 with 18 indexed Mongoose schemas |
| **Security** | W3C Web Crypto (ECDH + AES-256-GCM), bcrypt (12 rounds), HTTP-only cookies, JWT rotation, Zod schema validation |
| **Real-Time** | WebSockets (Socket.IO) & WebRTC (RTCPeerConnection + STUN) |
| **Mobile** | Android Capacitor ready, PWA Manifest, responsive touch navigation |
| **Testing** | Vitest, Supertest integration testing |

---

## 📁 Project Architecture

```
BatchiT/
│
├── client/                     # Frontend React + Vite
│   ├── public/
│   │   ├── favicon.svg         # BatchiT original brand logo
│   │   └── manifest.json       # PWA / Android manifest
│   ├── src/
│   │   ├── components/         # Calling modals, Logo, Skeletons, EmptyStates
│   │   ├── context/            # AuthContext, SocketContext (WebRTC + Socket.IO)
│   │   ├── layouts/            # AppLayout (Desktop Sidebar + Mobile Bottom Nav)
│   │   ├── pages/              # Landing, Login, Register, Chat, Camera, Snaps, Stories, Friends, Calls, Memories, Settings
│   │   ├── services/           # Axios instance (api.js), E2EE Web Crypto (crypto.js)
│   │   ├── App.jsx             # Route definitions & guards
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind + Custom Design System
│   ├── tailwind.config.js      # BatchiT premium dark color palette
│   └── vite.config.js          # Vite config & API reverse proxy
│
├── server/                     # Backend Node.js + Express
│   ├── src/
│   │   ├── config/             # Environment, Database, Logger (Pino)
│   │   ├── controllers/        # Auth, User, Friend, Conversation, Message, Snap, Story, Call, Group, Memory, Device, Report
│   │   ├── middleware/         # Auth, RateLimiter, Upload (Multer), Validation (Zod), ErrorHandler
│   │   ├── models/             # 18 Mongoose models (User, Friendship, Message, Snap, Call, etc.)
│   │   ├── routes/             # REST API routes
│   │   ├── services/           # Token, Audit, Streak calculation
│   │   ├── sockets/            # Socket.IO presence, messaging & WebRTC signaling
│   │   ├── validators/         # Zod schemas for input validation
│   │   └── server.js           # Server entrypoint
│   ├── test/                   # Vitest integration test suite
│   ├── .env.example            # Environment variables template
│   └── package.json            # Server dependencies
│
├── mobile/                     # Android Capacitor integration
│   ├── capacitor.config.json   # Capacitor mobile config
│   └── README.md               # Android Studio compilation guide
│
├── package.json                # Root orchestration scripts
└── README.md                   # Project documentation
```

---

## 🗄️ MongoDB Schemas (18 Models)

1. **User**: Authentication credentials, profile info, E2EE public key, privacy controls, vault PIN hash.
2. **FriendRequest**: Sender, recipient, status (`pending`, `accepted`, `rejected`, `cancelled`).
3. **Friendship**: Canonical ordered user pair (`user1 < user2`), status (`active`, `blocked`).
4. **Conversation**: 1-to-1 or group participants, last message pointer, theme, disappearing timer.
5. **Message**: Sender, conversation, content, E2EE ciphertext, IV, media attachments, delivery status (`SENT`, `DELIVERED`, `READ`), reactions, reply references.
6. **Snap**: Sender, recipients list with status (`SENT`, `DELIVERED`, `OPENED`, `EXPIRED`), duration, view-once flag, filters, drawing paths, expiration date.
7. **Story**: User, media URL, caption, audience (`everyone`, `friends`, `close_friends`), 24h expiration.
8. **StoryView**: Story reference, viewer reference, emoji reaction, reply text, view timestamp.
9. **Call**: Caller, recipient, call type (`audio`, `video`), status (`initiated`, `ringing`, `accepted`, `rejected`, `missed`, `ended`), duration.
10. **Group**: Group name, avatar, creator, associated group conversation.
11. **GroupMember**: Group reference, user reference, role (`admin`, `moderator`, `member`).
12. **Notification**: Recipient, sender, type (`message`, `snap`, `call`, `friend_request`, `streak`), body, deep-link.
13. **Streak**: Canonical user pair, daily streak count, last snap timestamps, expiration timer.
14. **Memory**: User, media URL, album, `isVault` privacy flag, title, tags.
15. **Device**: Registered user device ID, platform, browser, IP address, last active date.
16. **Session**: Refresh token hash, user agent, expiration, revocation status.
17. **Report**: Reporter, target entity (user/message/snap), reason, status.
18. **AuditLog**: User, action name, IP address, timestamp, audit metadata.

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **MongoDB** running locally on port `27017` or MongoDB Atlas URI

### 2. Environment Setup
Configure `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/batchit
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
```

### 3. Installation
Install dependencies for both client and server:
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 4. Running the Application
In separate terminal tabs:
```bash
# Start Backend Server (runs on http://localhost:5000)
cd server
npm start

# Start Frontend Dev Server (runs on http://localhost:5173)
cd client
npm run dev
```

Open your browser at `http://localhost:5173` to explore BatchiT.

### 5. Running the Backend Integration Tests
Execute the Vitest integration test suite:
```bash
cd server
npm test
```
All 12 end-to-end integration tests will run against the database to verify authentication, friend requests, real-time messaging, snaps, and stories.

---

## 📱 Converting to Android (Capacitor)

BatchiT is structured to compile seamlessly to native Android using Capacitor. See [`mobile/README.md`](file:///c:/Users/dhaka/Desktop/BatchiT/mobile/README.md) for full Android Studio instructions.

---

## 🔒 Security Architecture Highlights

- **Passwords**: Hashed with `bcryptjs` using 12 salt rounds; plaintext passwords never touch database logs or API responses.
- **Session Tokens**: Short-lived JWTs (15 min) in HTTP-only cookies paired with rotating refresh tokens (7 days) with device session revocation.
- **Client E2EE**: In private chats, keys are computed via ECDH directly in the browser using the Web Crypto API. Ciphertext is encrypted with AES-GCM and decrypted locally.
- **Rate Limiting**: Brute-force protection applied to `/api/auth/*` endpoints and global throttling on API routes.
- **Validation**: Strict schema enforcement using `zod` on all incoming requests.

---

## 📄 License
ISC License © BatchiT Team.
