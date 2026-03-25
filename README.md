# AETHER – Developer Social Platform

> **Connect. Build. Grow.** A SaaS-level educational social media platform for developers and students.

![AETHER](https://img.shields.io/badge/AETHER-Developer%20Social%20Platform-6C63FF?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=flat-square&logo=firebase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=flat-square&logo=tailwindcss)

## 🎯 Overview

AETHER combines features of Instagram, LinkedIn, WhatsApp and GitHub into a single platform focused on developers and students. Built with modern iPhone-style Bento UI design, glassmorphism effects, and smooth animations.

## ✨ Features

### 👤 Authentication
- Email/password & Google OAuth login
- Real-time username availability checker
- Multi-step onboarding (skills, interests, bio)

### 📸 Social Feed
- Global & following feed
- Create posts with images/videos
- Like, comment, share, save/bookmark
- Hashtag support
- Infinite scroll pagination

### 📁 Project Sharing (Core USP)
- Upload coding projects with preview images
- GitHub repo + live demo links
- Tags for discoverability
- Public/private visibility toggle
- Project management dashboard

### 👥 Follow System
- Follow/unfollow users
- Private accounts with follow request flow
- Followers/following counts

### 💬 Real-time Chat
- One-to-one messaging with Firebase Realtime
- Media/image sharing in chat
- Delivered/seen indicators
- User search to start new conversations

### 📖 Stories
- 24-hour expiring stories
- Upload image/video stories
- Story progress bars
- Tap-to-navigate viewer

### 🔔 Notifications
- Real-time notification feed
- Types: likes, comments, follows, follow requests
- Mark all as read
- Accept/decline follow requests

### 📊 Dashboard
- Bento grid analytics
- Post & project stats
- Follower/following counts
- Activity graph
- Profile overview

### 🛡️ Admin Panel
- User management (ban, role assignment)
- Content moderation (delete posts/projects)
- Report resolution
- Overview analytics
- Audit logging

## 🎨 UI Design System

- **Bento Grid** layout (iOS widget-style cards)
- **Glassmorphism** (blur + transparency layers)
- **Soft shadows** and gradient accents
- **Dark/Light mode** toggle (persisted to localStorage)
- **Smooth animations** via Framer Motion
- **Mobile-first** responsive design with bottom tab navigation
- **Ripple effects** and micro-interactions
- **Skeleton loaders** for loading states

## 🗂️ Folder Structure

```
src/
├── components/
│   ├── common/          # Avatar, Button, Modal, SkeletonLoader
│   ├── layout/          # MainLayout, Sidebar, BottomNav, Header
│   ├── notifications/   # NotificationItem
│   ├── posts/           # PostCard, CreatePost
│   └── stories/         # StoryCircle, StoryViewer
├── contexts/
│   ├── AuthContext.jsx  # Firebase Auth state
│   └── ThemeContext.jsx # Dark/Light mode
├── firebase/
│   └── config.js        # Firebase initialization
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Onboarding.jsx
│   ├── Home.jsx
│   ├── Profile.jsx
│   ├── Projects.jsx
│   ├── Chat.jsx
│   ├── Stories.jsx
│   ├── Notifications.jsx
│   ├── Dashboard.jsx
│   ├── Explore.jsx
│   └── AdminPanel.jsx
└── index.css            # Global styles + design tokens
```

## 🗄️ Firestore Collections

| Collection | Description |
|---|---|
| `users` | User profiles with followers, skills, role |
| `usernames` | Username → UID lookup (uniqueness) |
| `posts` | Feed posts with media, likes, comments |
| `projects` | Developer projects with visibility control |
| `chats` | Chat rooms (1:1 or group) |
| `chats/{id}/messages` | Realtime messages |
| `stories` | 24-hour expiring stories |
| `notifications` | Per-user notification feed |
| `reports` | User/content reports |
| `logs` | Admin action audit logs |

## 🚀 Getting Started

### Option A – Standalone HTML/CSS/JS (no npm required)

These files work directly in any browser with **no build step**. Firebase is loaded via CDN.

| File | Purpose |
|---|---|
| `login.html` | User login (email/password + Google) |
| `admin-login.html` | **Admin-only** login with role verification |
| `admin.html` | Admin panel dashboard |
| `firebase-config.js` | Shared Firebase config (edit this file) |

**Steps:**

1. Open `firebase-config.js` and replace the placeholder values with your Firebase project config:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

2. Open `login.html` via a local HTTP server — opening directly as `file://` will fail due to browser CORS restrictions. A quick option: `npx serve .` or `python3 -m http.server 8080`, then visit `http://localhost:8080/login.html`.

3. To access the admin panel, navigate to `admin-login.html`. Only users with `role: "admin"`, `"super_admin"`, or `"moderator"` in Firestore are allowed in.

---

### Option B – React/Vite (full app with npm)

#### 1. Clone and install

```bash
git clone https://github.com/Harshitkashyap2027/AETHERX.git
cd AETHERX
npm install
```

#### 2. Set up Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google)
3. Create a **Firestore Database**
4. Enable **Storage**
5. Copy your config and create `.env`:

```bash
cp .env.example .env
# Fill in your Firebase config values
```

#### 3. Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

#### 4. Run locally

```bash
npm run dev
```

#### 5. Build for production

```bash
npm run build
firebase deploy --only hosting
```

## 🛡️ Security

- Firestore rules enforce owner-only writes
- Storage rules validate file type and size
- Admin routes protected client-side and server-side via role field
- Firebase Auth handles session management
- Private content respects `isPublic` and `isPrivate` flags

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend (standalone) | **Vanilla HTML + CSS + JavaScript** |
| Frontend (full app) | React 18 + Vite |
| Styling (standalone) | Custom CSS (glassmorphism design) |
| Styling (full app) | TailwindCSS 3 |
| Backend | Firebase (CDN for standalone / npm for full app) |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Routing (full app) | React Router v6 |

## 📱 Admin Access

To promote a user to admin, update their `role` field in Firestore manually:

```
users/{uid}.role = "admin"         // admin access
users/{uid}.role = "super_admin"   // super admin
users/{uid}.role = "moderator"     // moderator
```

**Standalone HTML flow:**
- Regular users log in at `login.html`
- Admins log in at a **separate page** → `admin-login.html`
- `admin-login.html` verifies the Firebase role before granting access to `admin.html`
- Regular users attempting to access admin pages are blocked and shown an access-denied screen

**React/Vite flow:**
- Admin users see an "Admin Panel" link in the sidebar and can access `/admin`

## 🔮 Roadmap

- [ ] WebRTC audio/video calls
- [ ] AI code reviewer integration
- [ ] GitHub repo auto-import
- [ ] Portfolio auto-generator
- [ ] Code playground (run code in browser)
- [ ] Hackathon mode
- [ ] Mentor/mentee matching system
- [ ] PWA + offline mode
