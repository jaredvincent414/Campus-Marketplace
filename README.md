<div align="center">

# UniMarket

**A full-stack campus marketplace built for students.**
List items, discover local deals, and close transactions — all from your phone.

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?style=flat-square&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socket.io&logoColor=white)

</div>

---

## What is UniMarket?

UniMarket is a **mobile-first peer-to-peer marketplace** designed for university campuses. Students can buy and sell items within their community, with real-time in-app messaging tied directly to individual listings.

**Highlights for recruiters:**
- Full-stack solo project — from database schema to mobile UI
- Real-time messaging with Socket.IO (bidirectional events, room-based architecture)
- File upload pipeline with MongoDB GridFS for image and video media (up to 40 MB per file)
- File-based routing with Expo Router (similar to Next.js app directory model)
- Theming system, context-based state, and reusable component architecture
- `.edu` email-gated sign-up with client-side auth and clear path to production JWT upgrade

---

## App Screens

### Onboarding
<table>
  <tr>
    <td align="center">
      <img src="docs/images/navigation/LandingPage.png" alt="Landing page" width="210" />
      <br /><strong>Landing</strong><br />
      Brand entry point
    </td>
    <td align="center">
      <img src="docs/images/navigation/createAccountscreen.png" alt="Create account" width="210" />
      <br /><strong>Create Account</strong><br />
      .edu-gated student sign-up
    </td>
  </tr>
</table>

### Core Experience
<table>
  <tr>
    <td align="center">
      <img src="docs/images/navigation/explorePage.png" alt="Explore" width="210" />
      <br /><strong>Explore</strong><br />
      Browse and search listings
    </td>
    <td align="center">
      <img src="docs/images/navigation/saved.png" alt="Saved listings" width="210" />
      <br /><strong>Saved</strong><br />
      Favorited items, revisit anytime
    </td>
  </tr>
</table>

### Seller Tools
<table>
  <tr>
    <td align="center">
      <img src="docs/images/navigation/myListings.png" alt="My listings" width="210" />
      <br /><strong>My Listings</strong><br />
      Create, manage, and close listings
    </td>
    <td align="center">
      <img src="docs/images/navigation/profile.png" alt="Profile" width="210" />
      <br /><strong>Profile</strong><br />
      Account hub and seller settings
    </td>
  </tr>
</table>

> **Navigation flow:** Landing → Create Account → Explore → Save / Message / List / Profile
>
> Messages lives in the persistent bottom tab bar — accessible from any screen during buyer or seller workflows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | Expo SDK 54 + React Native 0.81 |
| Language | TypeScript 5.9 |
| Navigation | Expo Router (file-based, similar to Next.js App Router) |
| Real-time | Socket.IO (bidirectional, room-based messaging) |
| Media | Expo Image Picker, GridFS via Multer |
| Local persistence | AsyncStorage |
| Push notifications | Expo Notifications |
| API | Node.js + Express |
| Database | MongoDB + Mongoose |
| Dev tooling | Nodemon, dotenv |

---

## Architecture

```
.
├── project/
│   ├── unimarketBackend/          # REST API + Socket.IO server
│   │   └── src/
│   │       ├── controllers/       # Route handlers
│   │       ├── models/            # Mongoose schemas (User, Listing, Conversation, Message)
│   │       ├── routes/            # Express routers
│   │       ├── services/          # Business logic
│   │       ├── middleware/        # Upload, CORS, error handling
│   │       └── index.js           # Entry point
│   └── unimarketFrontend/         # Expo + React Native client
│       ├── app/
│       │   ├── (auth)/            # Onboarding screens
│       │   ├── (tabs)/            # Bottom tab navigation
│       │   └── (modals)/          # Overlay screens
│       └── src/
│           ├── components/        # Shared UI components
│           ├── contexts/          # Global state (auth, theme)
│           ├── hooks/             # Custom React hooks
│           ├── services/          # API + Socket.IO client layer
│           └── theme/             # Design tokens (colors, spacing)
└── docs/images/                   # README screenshots
```

---

## Key Features

### Marketplace
- Create listings with title, description, price, category, and media
- Image/video uploads via multipart form-data, stored in MongoDB GridFS
- Listing lifecycle: `available` → `pending` → `sold` (soft-delete for `deleted`)
- Self-purchase prevention enforced at the API layer

### Real-Time Messaging
- Conversations are scoped to `(listingId, buyerEmail, sellerEmail)` — no duplicate threads
- Inbox with per-conversation unread counts and listing context snapshots
- Sellers can mark a listing `pending` or `sold` directly from within a conversation thread
- Socket.IO rooms: `user:<email>` for inbox refreshes, `conversation:<id>` for live messages

### Mobile UX
- Bottom tab navigation: **Explore, My Listings, Messages, Saved, Profile**
- Listing detail modal with image carousel
- Consistent design via centralized theme (`src/theme/colors.ts`)

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- Expo Go app or iOS/Android simulator

### 1. Install dependencies
```bash
cd project/unimarketBackend && npm install
cd ../unimarketFrontend && npm install
```

### 2. Configure environment

**Backend** — `project/unimarketBackend/.env`
```env
PORT=5001
MONGO_URI=<your_mongodb_connection_string>
```

**Frontend (optional)** — `project/unimarketFrontend/.env`
```env
EXPO_PUBLIC_API_BASE_URL=http://<your-machine-ip>:5001
```
> If not set, the frontend auto-resolves the host from the Expo dev server.

### 3. Run the app

```bash
# Terminal 1 — backend
cd project/unimarketBackend && npm run dev

# Terminal 2 — frontend
cd project/unimarketFrontend && npm start
```

Then in the Expo CLI: press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go.

> Push notifications require a development build — Expo Go does not support them.

---

## API Reference

Base URL: `http://<host>:5001`

### Users
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users` | Create or update user by email |

### Listings
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/listings` | All active/pending listings |
| `GET` | `/api/listings/user/:email` | Listings by user |
| `GET` | `/api/listings/:id` | Single listing |
| `POST` | `/api/listings` | Create listing (requires ≥1 image) |
| `POST` | `/api/listings/upload` | Upload media (multipart) |
| `POST` | `/api/listings/:id/purchase` | Initiate purchase (no self-buy) |
| `POST` | `/api/listings/:id/mark-pending` | Seller marks as pending |
| `POST` | `/api/listings/:id/mark-sold` | Seller marks as sold |
| `PUT` | `/api/listings/:id` | Update listing |
| `DELETE` | `/api/listings/:id` | Soft-delete listing |

### Conversations & Messages
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/conversations` | Inbox for user |
| `POST` | `/api/conversations` | Create or reopen thread |
| `GET` | `/api/conversations/:id` | Single conversation |
| `GET` | `/api/conversations/:id/messages` | Message history |
| `POST` | `/api/conversations/:id/messages` | Send message |
| `POST` | `/api/conversations/:id/read` | Mark messages read |

---

## Socket.IO Events

| Direction | Event | Description |
|---|---|---|
| Client → Server | `join-user` | Subscribe to user inbox room |
| Client → Server | `join-conversation` | Subscribe to conversation room |
| Client → Server | `leave-conversation` | Unsubscribe from conversation room |
| Server → Client | `message:new` | New message in a conversation |
| Server → Client | `inbox:refresh` | Trigger inbox reload for a user |
| Server → Client | `listing:status` | Broadcast listing status change |
| Server → Client | `conversation:read` | Mark conversation as read |

---

## Data Models

<details>
<summary><strong>User</strong></summary>

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, unique, normalized |

</details>

<details>
<summary><strong>Listing</strong></summary>

| Field | Type | Notes |
|---|---|---|
| `title`, `description`, `price` | String/Number | Required |
| `category`, `userEmail` | String | |
| `imageUrl` | String | Primary image |
| `media[]` | `{ type, url }` | `image` or `video` |
| `status` | Enum | `available \| pending \| sold \| deleted` |

</details>

<details>
<summary><strong>Conversation</strong></summary>

| Field | Type | Notes |
|---|---|---|
| `listingId` | ObjectId ref | |
| `buyerEmail`, `sellerEmail` | String | Composite unique key with `listingId` |
| `lastMessage`, `lastMessageAt` | String/Date | |
| `status` | Enum | `active \| archived \| blocked \| closed` |
| `listingSnapshot` | Object | Denormalized title/price/thumbnail/status |

</details>

<details>
<summary><strong>Message</strong></summary>

| Field | Type | Notes |
|---|---|---|
| `conversationId` | ObjectId ref | |
| `senderEmail`, `body` | String | |
| `sentAt`, `readAt` | Date | |
| `deliveryStatus` | Enum | `sent \| delivered` |

</details>

---

## Auth Notes

Current auth uses **client-side persistence via AsyncStorage** — suitable for a portfolio prototype:
- Sign-up validates `.edu` email format
- Accounts stored locally and synced to backend as a best-effort profile
- The clear production upgrade path is server-side JWT or OAuth (middleware stubs are already structured for it)

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `Port 5001 already in use` | Stop the existing backend process or change `PORT` in `.env` |
| `Network request failed` on device | Set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP (not `localhost`) |
| Uploaded media not rendering | Confirm `/api/media/:id` is reachable from the device; re-check file type/size limits |
| Messages not updating live | Verify Socket.IO connection; ensure `join-user` and `join-conversation` are emitted after connect |

---

## Roadmap

- [ ] Replace client-side auth with server-validated JWT
- [ ] Add authorization middleware on all protected routes
- [ ] Pagination and search/filter for listings and messages
- [ ] Automated tests (unit, integration, E2E)
- [ ] CI pipeline for lint, typecheck, and test

---

## License

No license file is currently present in this repository.
