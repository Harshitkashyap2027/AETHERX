import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoSendOutline, IoSearchOutline, IoImageOutline, IoArrowBack,
  IoEllipsisVertical, IoAddOutline, IoCheckmarkDone,
} from 'react-icons/io5';
import {
  collection, query, where, orderBy, onSnapshot, addDoc,
  serverTimestamp, getDocs, doc, getDoc, updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow, format, isToday } from 'date-fns';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/common/Avatar';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const fileRef = useRef();

  // Subscribe to user chats
  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user.uid]);

  // Open chat from URL param
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const found = chats.find((c) => c.id === chatId);
      if (found) setActiveChat(found);
    }
  }, [chatId, chats]);

  // Subscribe to messages
  useEffect(() => {
    if (!activeChat) return;
    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    return unsub;
  }, [activeChat]);

  const getOtherUser = (chat) => {
    const otherUid = chat.participants?.find((p) => p !== user.uid);
    return chat.participantData?.[otherUid] || { displayName: 'Unknown', photoURL: '' };
  };

  const openChat = (chat) => {
    setActiveChat(chat);
    navigate(`/chat/${chat.id}`, { replace: true });
  };

  const searchForUsers = async (val) => {
    setSearchUsers(val);
    if (!val.trim() || val.length < 2) { setFoundUsers([]); return; }
    setSearching(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', val.toLowerCase()),
        where('username', '<=', val.toLowerCase() + '\uf8ff')
      );
      const snap = await getDocs(q);
      setFoundUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.uid !== user.uid));
    } catch {
      setFoundUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const startChat = async (otherUser) => {
    // Check if chat already exists
    const existing = chats.find((c) =>
      c.participants?.length === 2 &&
      c.participants.includes(user.uid) &&
      c.participants.includes(otherUser.uid)
    );
    if (existing) { openChat(existing); setSearchUsers(''); setFoundUsers([]); return; }

    const chatData = {
      participants: [user.uid, otherUser.uid],
      participantData: {
        [user.uid]: { displayName: userProfile?.displayName, photoURL: userProfile?.photoURL, username: userProfile?.username },
        [otherUser.uid]: { displayName: otherUser.displayName, photoURL: otherUser.photoURL, username: otherUser.username },
      },
      isGroup: false,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'chats'), chatData);
    openChat({ id: docRef.id, ...chatData });
    setSearchUsers(''); setFoundUsers([]);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !activeChat) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        senderId: user.uid,
        text,
        mediaUrl: '',
        seen: false,
        timestamp: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleMediaSend = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;
    const ext = file.name.split('.').pop();
    const r = ref(storage, `chat-media/${activeChat.id}/${uuidv4()}.${ext}`);
    const task = uploadBytesResumable(r, file);
    task.on('state_changed', null, null, async () => {
      const url = await getDownloadURL(task.snapshot.ref);
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        senderId: user.uid,
        text: '',
        mediaUrl: url,
        mediaType: file.type.startsWith('video') ? 'video' : 'image',
        seen: false,
        timestamp: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: '📷 Media',
        lastMessageAt: serverTimestamp(),
      });
    });
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = ts?.toDate?.() || new Date(ts);
    return isToday(date) ? format(date, 'HH:mm') : formatDistanceToNow(date, { addSuffix: true });
  };

  const otherUser = activeChat ? getOtherUser(activeChat) : null;

  return (
    <div className="flex h-[calc(100vh-60px)] lg:h-[calc(100vh-0px)]">
      {/* Sidebar */}
      <div className={`${activeChat ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-white/8`}>
        {/* Header */}
        <div className="p-4 border-b border-white/8">
          <h2 className="text-lg font-semibold text-white mb-3">Messages</h2>
          <div className="relative">
            <IoSearchOutline size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={searchUsers}
              onChange={(e) => searchForUsers(e.target.value)}
              placeholder="Search users to chat…"
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
          {foundUsers.length > 0 && (
            <div className="mt-2 bento-card overflow-hidden">
              {foundUsers.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => startChat(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors"
                >
                  <Avatar src={u.photoURL} alt={u.displayName} size={36} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{u.displayName}</p>
                    <p className="text-xs text-white/40">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-white/40 text-sm">No conversations yet</p>
              <p className="text-white/25 text-xs mt-1">Search for users to start chatting</p>
            </div>
          ) : (
            chats.map((chat) => {
              const other = getOtherUser(chat);
              return (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors ${activeChat?.id === chat.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                >
                  <Avatar src={other.photoURL} alt={other.displayName} size={44} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">{other.displayName}</p>
                      <p className="text-xs text-white/30">{formatTime(chat.lastMessageAt)}</p>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{chat.lastMessage || 'Say hello!'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 glass-dark">
            <button
              onClick={() => { setActiveChat(null); navigate('/chat'); }}
              className="lg:hidden p-1.5 rounded-xl hover:bg-white/10 text-white/60"
            >
              <IoArrowBack size={20} />
            </button>
            <Avatar src={otherUser?.photoURL} alt={otherUser?.displayName} size={38} />
            <div>
              <p className="text-sm font-semibold text-white">{otherUser?.displayName}</p>
              <p className="text-xs text-white/40">@{otherUser?.username}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMine = msg.senderId === user.uid;
              const ts = msg.timestamp?.toDate?.() || new Date(msg.timestamp);
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={isMine ? 'message-bubble-sent' : 'message-bubble-received'}>
                    {msg.mediaUrl ? (
                      msg.mediaType === 'video' ? (
                        <video src={msg.mediaUrl} controls className="max-w-xs rounded-lg" />
                      ) : (
                        <img src={msg.mediaUrl} alt="" className="max-w-xs rounded-lg" />
                      )
                    ) : (
                      <p className="text-sm">{msg.text}</p>
                    )}
                    <p className={`text-xs mt-1 ${isMine ? 'text-white/50' : 'text-white/30'}`}>
                      {ts ? format(ts, 'HH:mm') : ''}
                      {isMine && <IoCheckmarkDone size={12} className="inline ml-1" />}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/8">
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/8 text-white/50 hover:text-white hover:bg-white/12 transition-colors"
              >
                <IoImageOutline size={20} />
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaSend} />

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message…"
                className="input-field flex-1 py-2.5"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />

              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="p-2.5 rounded-xl gradient-bg text-white disabled:opacity-40 transition-all"
              >
                <IoSendOutline size={18} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-white font-semibold">Select a conversation</p>
            <p className="text-white/40 text-sm mt-1">Or search for users to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
