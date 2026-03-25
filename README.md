# AETHERX – Developer Social Platform

> **Connect. Build. Grow.** A full-stack social media platform built for developers and students.

![AETHERX](https://img.shields.io/badge/AETHERX-Developer%20Social%20Platform-6C63FF?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=flat-square&logo=firebase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11-0055FF?style=flat-square&logo=framer)

## 🎯 Overview

**AETHERX** combines the best of Instagram, LinkedIn, WhatsApp, and GitHub into one platform focused on developers and students. It features a modern iPhone-style Bento UI with glassmorphism effects, smooth animations powered by Framer Motion, and real-time features via Firebase.

Whether you're sharing a project, posting code snippets, chatting with fellow developers, or browsing 24-hour stories — AETHERX has you covered.

---

## ✨ Features

### 👤 Authentication & Onboarding
- Email/password login and registration
- Google OAuth one-tap sign-in
- Real-time username availability checker (debounced)
- Multi-step onboarding flow (display name, username, bio, skills, interests)
- Auto-redirect after login/register

### 📸 Social Feed (Home)
- Global feed and a personalised **Following** feed
- Create posts with text, images, or videos
- Like, comment, share, and bookmark posts
- Hashtag support for discoverability
- Infinite scroll with "Load more" pagination
- 24-hour story strip inline at the top of the feed
- One-click story upload directly from the feed

### 📖 Stories
- Dedicated `/stories` page with a full grid view
- Upload image or video stories with live upload-progress indicator
- Stories grouped by user; expire automatically after **24 hours**
- Immersive full-screen story viewer with tap-to-advance and progress bars
- Stories also accessible from the Home feed story strip

### 📁 Project Sharing
- Upload coding projects with a preview image
- Add a GitHub repo URL + live demo link
- Tag projects for discoverability (e.g. `react`, `python`, `open-source`)
- Public / Private visibility toggle
- Star / un-star projects
- Full project management dashboard (edit, delete)
- Projects visible on user profiles under the **Projects** tab

### 👥 Social Graph
- Follow and unfollow users
- Private accounts with a **follow-request** flow (accept / decline)
- Followers and following counts on profiles
- Follow requests surface in the Notifications feed

### 💬 Real-time Chat
- One-to-one messaging with Firebase Realtime Database
- Image and media sharing inside chat threads
- Delivered / Seen indicators
- Search users to start a new conversation
- Chat list sorted by most recent message
- Typing indicator

### 🔔 Notifications
- Real-time notification feed with live updates
- Notification types: likes, comments, follows, follow requests
- Accept or decline follow requests directly from Notifications
- Mark all as read

### 📊 Dashboard
- Personal analytics in a Bento grid layout
- Post count, project count, total likes received
- Follower and following counts
- Profile views counter
- Engagement score (avg likes / post)
- Recent posts preview
- 7-day activity graph

### 🔍 Explore
- Search users by username with prefix matching
- Search projects by title and description
- Browse trending posts and top users
- Tabs: **People**, **Posts**, **Projects**

### 🛡️ Admin Panel
- User management: view all users, ban / unban, assign roles
- Content moderation: delete posts and projects
- Report resolution queue
- Overview analytics cards
- Audit log of all admin actions
- Protected: only `admin` and `super_admin` roles can access

---

## 🎨 UI / UX Design System

| Feature | Detail |
|---|---|
| Layout | Bento grid — iOS widget-style cards |
| Effects | Glassmorphism (blur + transparency) |
| Shadows | Soft glow shadows with gradient accents |
| Theme | Dark / Light mode toggle (persisted to `localStorage`) |
| Animations | Framer Motion — page transitions, staggered lists, hover lifts |
| Responsive | Mobile-first; Bottom Tab Bar on mobile, Sidebar on desktop |
| Typography | SF Pro / System font stack |
| Interactions | Ripple effects, skeleton loaders, micro-animations |

---

## 🗂️ Folder Structure

```
AETHERX/
├── index.html                 # Vite HTML entry
├── login.html                 # Standalone login (no npm)
├── admin-login.html           # Standalone admin login (no npm)
├── admin.html                 # Standalone admin panel (no npm)
├── firebase-config.js         # Shared Firebase config for standalone HTML
├── firestore.rules            # Firestore security rules
├── storage.rules              # Firebase Storage security rules
├── tailwind.config.js
├── vite.config.js
├── .env.example               # Environment variable template
└── src/
    ├── App.jsx                # Router & protected routes
    ├── main.jsx
    ├── index.css              # Global styles & design tokens
    ├── firebase/
    │   └── config.js          # Firebase SDK initialization
    ├── contexts/
    │   ├── AuthContext.jsx    # Firebase Auth state & helpers
    │   └── ThemeContext.jsx   # Dark / Light mode state
    ├── components/
    │   ├── common/
    │   │   ├── Avatar.jsx
    │   │   ├── Button.jsx
    │   │   ├── Modal.jsx
    │   │   └── SkeletonLoader.jsx
    │   ├── layout/
    │   │   ├── MainLayout.jsx
    │   │   ├── Sidebar.jsx    # Desktop left sidebar
    │   │   ├── Header.jsx     # Mobile top header
    │   │   └── BottomNav.jsx  # Mobile bottom tab bar
    │   ├── notifications/
    │   │   └── NotificationItem.jsx
    │   ├── posts/
    │   │   ├── PostCard.jsx
    │   │   └── CreatePost.jsx
    │   └── stories/
    │       ├── StoryCircle.jsx
    │       └── StoryViewer.jsx
    └── pages/
        ├── Login.jsx
        ├── Register.jsx
        ├── Onboarding.jsx
        ├── Home.jsx
        ├── Stories.jsx
        ├── Explore.jsx
        ├── Projects.jsx
        ├── Chat.jsx
        ├── Notifications.jsx
        ├── Dashboard.jsx
        ├── Profile.jsx
        └── AdminPanel.jsx
```

---

## 🗄️ Firestore Data Model

| Collection | Description |
|---|---|
| `users/{uid}` | Profile: displayName, username, bio, photoURL, skills, role, followers, following, followRequests, isPrivate, isVerified |
| `usernames/{username}` | Maps username → `{ uid }` for uniqueness check |
| `posts/{postId}` | Feed posts: caption, mediaUrl, mediaType, likes, comments, userId, createdAt |
| `projects/{projectId}` | Developer projects: title, description, previewUrl, repoUrl, demoUrl, tags, isPublic, stars, ownerId |
| `chats/{chatId}` | Chat rooms: participants, participantData, lastMessage, lastMessageAt |
| `chats/{chatId}/messages/{msgId}` | Individual messages: text, imageUrl, senderId, timestamp, seen |
| `stories/{storyId}` | 24-hour stories: mediaUrl, mediaType, userId, viewers, createdAt |
| `notifications/{notifId}` | Per-user notifications: type, fromUid, postId, read, createdAt |
| `reports/{reportId}` | User/content reports |
| `logs/{logId}` | Admin action audit logs |

---

## 🚀 Getting Started

### Option A – Standalone HTML (no npm required)

These files work directly in any modern browser. Firebase is loaded via CDN.

| File | Purpose |
|---|---|
| `login.html` | User login (email/password + Google) |
| `admin-login.html` | Admin-only login with role verification |
| `admin.html` | Admin panel dashboard |
| `firebase-config.js` | Shared Firebase config — **edit this file first** |

**Steps:**

1. Open `firebase-config.js` and paste your Firebase project credentials:

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

2. Serve the folder over HTTP (opening as `file://` fails due to CORS):

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080/login.html`.

3. Admins log in at `http://localhost:8080/admin-login.html`. Only users with `role: "admin"`, `"super_admin"`, or `"moderator"` in Firestore are allowed.

---

### Option B – React / Vite (full app)

#### 1. Clone and install dependencies

```bash
git clone https://github.com/Harshitkashyap2027/AETHERX.git
cd AETHERX
npm install
```

#### 2. Set up Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password + Google
3. Create a **Firestore Database** (production mode)
4. Enable **Storage**
5. Copy your config:

```bash
cp .env.example .env
# Fill in all VITE_FIREBASE_* variables
```

#### 3. Deploy Firestore & Storage rules

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

---

## 🔐 Security

- **Firestore rules** enforce owner-only writes; only `admin` / `super_admin` roles can manage other users' content.
- **Storage rules** validate file MIME type and size before upload.
- **Admin routes** are protected both client-side (React route guard) and server-side (Firestore rules).
- Firebase Auth manages sessions; tokens are never stored manually.
- Private accounts hide their posts from non-followers.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | **React 18** + **Vite 5** |
| Styling | **TailwindCSS 3** + custom CSS design tokens |
| Animations | **Framer Motion 11** |
| Icons | **react-icons** (Ionicons 5) |
| Routing | **React Router v6** |
| Auth | **Firebase Authentication** |
| Database | **Cloud Firestore** |
| Storage | **Firebase Storage** |
| Notifications / Toast | **react-toastify** |
| Date formatting | **date-fns** |
| Standalone HTML | Vanilla JS + Firebase CDN |

---

## 📱 Route Map

| Route | Page | Auth Required |
|---|---|---|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/onboarding` | Onboarding | Auth |
| `/` | Home feed + Stories strip | Auth |
| `/explore` | Search + Trending | Auth |
| `/stories` | Stories gallery & viewer | Auth |
| `/projects` | Project showcase | Auth |
| `/chat` | Chat list | Auth |
| `/chat/:chatId` | Chat thread | Auth |
| `/notifications` | Notification feed | Auth |
| `/dashboard` | Analytics dashboard | Auth |
| `/profile` | Own profile | Auth |
| `/profile/:username` | Any user profile | Auth |
| `/admin` | Admin panel | Admin only |

---

## 👑 Admin Access

To promote a user to admin, update their document in Firestore:

```
users/{uid}.role = "admin"         // admin access
users/{uid}.role = "super_admin"   // super admin (can delete other admins)
users/{uid}.role = "moderator"     // moderator (standalone HTML admin panel only)
```

- **React app** Admin Panel: accessible at `/admin` for `admin` and `super_admin` roles.
- **Standalone HTML** Admin Panel: accessible at `admin.html` for `admin`, `super_admin`, and `moderator` roles.

---

## 🔮 Roadmap

- [ ] WebRTC audio / video calls
- [ ] AI code reviewer integration
- [ ] GitHub repository auto-import
- [ ] Portfolio auto-generator from projects
- [ ] In-browser code playground
- [ ] Hackathon mode
- [ ] Mentor / mentee matching system
- [ ] PWA with offline mode
- [ ] Push notifications (FCM)
- [ ] Code snippet posts with syntax highlighting

