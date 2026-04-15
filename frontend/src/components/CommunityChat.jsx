import React, {
    useState,
    useEffect,
    useRef,
    useContext,
    useCallback,
} from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import { AppContext } from '../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'

// ─── helpers ──────────────────────────────────────────────────────────────────
const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

// Group messages by date
const groupByDate = (messages) => {
    const groups = []
    let lastDate = null
    messages.forEach((msg) => {
        const d = formatDate(msg.createdAt)
        if (d !== lastDate) {
            groups.push({ type: 'date', label: d, id: 'date-' + msg._id })
            lastDate = d
        }
        groups.push({ type: 'message', ...msg })
    })
    return groups
}

// Avatar component
const Avatar = ({ name, image, size = 32 }) => {
    const initials = name
        ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
        : '?'
    const colours = [
        '#4E5BFF','#1976D2','#0ea5e9','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981',
    ]
    const bg = colours[(name?.charCodeAt(0) || 0) % colours.length]

    // If image looks like a real photo URL (not the giant base64 default)
    const isRealImage = image && image.startsWith('http')

    return isRealImage ? (
        <img
            src={image}
            alt={name}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
    ) : (
        <div
            style={{
                width: size, height: size, borderRadius: '50%', background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
            }}
        >
            {initials}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const CommunityChat = () => {
    const { token, userData, backendUrl } = useContext(AppContext)

    const [isOpen, setIsOpen]           = useState(false)
    const [messages, setMessages]       = useState([])
    const [input, setInput]             = useState('')
    const [onlineCount, setOnlineCount] = useState(0)
    const [typingUsers, setTypingUsers] = useState([])   // usernames typing
    const [isLoading, setIsLoading]     = useState(false)
    const [unread, setUnread]           = useState(0)

    const socketRef       = useRef(null)
    const messagesEndRef  = useRef(null)
    const inputRef        = useRef(null)
    const typingTimeout   = useRef(null)

    // Only patients can use the chat
    if (!token) return null

    // ── Scroll to bottom ──────────────────────────────────────────────────────
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior })
    }, [])

    // ── Fetch history ─────────────────────────────────────────────────────────
    const fetchHistory = useCallback(async () => {
        if (!token || !backendUrl) return
        setIsLoading(true)
        try {
            const { data } = await axios.get(`${backendUrl}/api/chat/history`, {
                headers: { token },
            })
            if (data.success) setMessages(data.messages)
        } catch (err) {
            console.error('Failed to fetch chat history', err)
        } finally {
            setIsLoading(false)
        }
    }, [token, backendUrl])

    // ── Connect socket ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token || !backendUrl) return

        const socket = io(backendUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        })

        socket.on('connect', () => {
            console.log('Community chat connected')
        })

        socket.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg])
            // If chat is closed, increment unread badge
            setUnread((prev) => (isOpen ? 0 : prev + 1))
        })

        socket.on('online_count', (count) => setOnlineCount(count))

        socket.on('user_typing', ({ username }) => {
            setTypingUsers((prev) =>
                prev.includes(username) ? prev : [...prev, username]
            )
        })

        socket.on('user_stop_typing', ({ username }) => {
            setTypingUsers((prev) => prev.filter((u) => u !== username))
        })

        socket.on('error_msg', (msg) => console.error('Socket error:', msg))

        socketRef.current = socket

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [token, backendUrl])

    // ── Open/close side effects ───────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            fetchHistory()
            setUnread(0)
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen, fetchHistory])

    // Auto-scroll on new messages when open
    useEffect(() => {
        if (isOpen) scrollToBottom()
    }, [messages, isOpen, scrollToBottom])

    // ── Send message ──────────────────────────────────────────────────────────
    const sendMessage = () => {
        const text = input.trim()
        if (!text || !socketRef.current?.connected) return
        socketRef.current.emit('send_message', { message: text })
        setInput('')
        clearTyping()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // ── Typing indicators ─────────────────────────────────────────────────────
    const clearTyping = () => {
        if (typingTimeout.current) clearTimeout(typingTimeout.current)
        socketRef.current?.emit('stop_typing')
    }

    const handleInputChange = (e) => {
        setInput(e.target.value)
        socketRef.current?.emit('typing')
        if (typingTimeout.current) clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(clearTyping, 2000)
    }

    // ── Grouped messages for rendering ────────────────────────────────────────
    const grouped = groupByDate(messages)

    const myId = userData?._id || userData?.id || ''

    // ── Emoji shortcuts ───────────────────────────────────────────────────────
    const EMOJIS = ['😊', '👍', '❤️', '😂', '🙏', '💪', '✅', '🤔']

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Floating Button ─────────────────────────────────────────── */}
            <motion.button
                onClick={() => setIsOpen((prev) => !prev)}
                title="Community Chat"
                className="fixed bottom-6 left-6 z-[999] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #4E5BFF 0%, #1976D2 100%)',
                    border: '3px solid rgba(255,255,255,0.3)',
                }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                animate={isOpen ? {} : { y: [0, -6, 0] }}
                transition={isOpen ? {} : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.span
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ color: '#fff', fontSize: 22, lineHeight: 1 }}
                        >
                            ✕
                        </motion.span>
                    ) : (
                        <motion.span
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ fontSize: 24 }}
                        >
                            💬
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Unread badge */}
                {!isOpen && unread > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                    >
                        {unread > 99 ? '99+' : unread}
                    </motion.span>
                )}
            </motion.button>

            {/* ── Backdrop ────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 z-[998]"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ── Chat Modal ──────────────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="chat-modal"
                        className="fixed z-[999] rounded-2xl overflow-hidden flex flex-col"
                        style={{
                            /* 70% of screen, centred with margin */
                            width: 'min(70vw, 880px)',
                            height: '72vh',
                            top: '50%',
                            left: '50%',
                            x: '-50%',
                            y: '-50%',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                            background: 'var(--chat-bg, #f8faff)',
                        }}
                        initial={{ opacity: 0, scale: 0.88, y: '-40%' }}
                        animate={{ opacity: 1, scale: 1, y: '-50%' }}
                        exit={{ opacity: 0, scale: 0.88, y: '-40%' }}
                        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                    >
                        {/* ── Header ──────────────────────────────────────── */}
                        <div
                            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #4E5BFF 0%, #1976D2 100%)',
                                color: '#fff',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">💬</div>
                                <div>
                                    <h2 className="text-lg font-bold tracking-wide leading-tight">
                                        Community Chat
                                    </h2>
                                    <p className="text-xs opacity-75">
                                        Healthcare community · {onlineCount} online
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Online dot */}
                                <div className="flex items-center gap-1.5 text-xs bg-white/20 rounded-full px-3 py-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    {onlineCount} online
                                </div>
                                {/* Close */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* ── Disclaimer banner ────────────────────────────── */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 text-xs flex-shrink-0"
                            style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', color: '#92400e' }}
                        >
                            <span>⚕️</span>
                            <span>
                                This chat is for community discussion only. Not a substitute for professional medical advice.
                            </span>
                        </div>

                        {/* ── Messages area ───────────────────────────────── */}
                        <div
                            className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
                            style={{ background: '#f0f4ff' }}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="flex flex-col items-center gap-3 text-gray-400">
                                        <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                                        <span className="text-sm">Loading messages…</span>
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                                    <div className="text-5xl">🏥</div>
                                    <p className="text-sm font-medium">No messages yet</p>
                                    <p className="text-xs">Be the first to start the conversation!</p>
                                </div>
                            ) : (
                                grouped.map((item) => {
                                    if (item.type === 'date') {
                                        return (
                                            <div key={item.id} className="flex items-center gap-3 py-2">
                                                <hr className="flex-1 border-gray-300" />
                                                <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-3 py-0.5 font-medium">
                                                    {item.label}
                                                </span>
                                                <hr className="flex-1 border-gray-300" />
                                            </div>
                                        )
                                    }

                                    const isMe = String(item.userId) === String(myId)

                                    return (
                                        <motion.div
                                            key={item._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            {/* Avatar */}
                                            {!isMe && (
                                                <Avatar
                                                    name={item.username}
                                                    image={item.userImage}
                                                    size={32}
                                                />
                                            )}

                                            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                {/* Username */}
                                                {!isMe && (
                                                    <span className="text-xs font-semibold text-gray-500 mb-1 ml-1">
                                                        {item.username}
                                                    </span>
                                                )}

                                                {/* Bubble */}
                                                <div
                                                    className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words"
                                                    style={
                                                        isMe
                                                            ? {
                                                                  background: 'linear-gradient(135deg,#4E5BFF,#1976D2)',
                                                                  color: '#fff',
                                                                  borderBottomRightRadius: 4,
                                                              }
                                                            : {
                                                                  background: '#fff',
                                                                  color: '#1e293b',
                                                                  borderBottomLeftRadius: 4,
                                                                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                                              }
                                                    }
                                                >
                                                    {item.message}
                                                </div>

                                                {/* Timestamp */}
                                                <span className="text-[10px] text-gray-400 mt-0.5 mx-1">
                                                    {formatTime(item.createdAt)}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )
                                })
                            )}

                            {/* Typing indicator */}
                            {typingUsers.length > 0 && (
                                <div className="flex items-center gap-2 py-1">
                                    <div className="flex gap-1 bg-white rounded-2xl px-3 py-2 shadow-sm">
                                        {[0,1,2].map(i => (
                                            <motion.div
                                                key={i}
                                                className="w-2 h-2 rounded-full bg-gray-400"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {typingUsers.slice(0, 2).join(', ')}
                                        {typingUsers.length > 2 ? ` +${typingUsers.length - 2}` : ''} typing…
                                    </span>
                                </div>
                            )}

                            {/* Scroll anchor */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Emoji quick-picks ────────────────────────────── */}
                        <div
                            className="flex gap-1 px-4 py-2 flex-shrink-0"
                            style={{ background: '#fff', borderTop: '1px solid #e2e8f0' }}
                        >
                            {EMOJIS.map((e) => (
                                <button
                                    key={e}
                                    onClick={() => setInput((prev) => prev + e)}
                                    className="text-lg hover:scale-125 transition-transform"
                                    title={e}
                                >
                                    {e}
                                </button>
                            ))}
                            <span className="flex-1" />
                            <span className="text-xs text-gray-300 self-center">
                                {input.length}/1000
                            </span>
                        </div>

                        {/* ── Input bar ───────────────────────────────────── */}
                        <div
                            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                            style={{ background: '#fff', borderTop: '1px solid #e2e8f0' }}
                        >
                            <Avatar
                                name={userData?.name}
                                image={userData?.image}
                                size={36}
                            />

                            <input
                                ref={inputRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Share with the community… (Enter to send)"
                                maxLength={1000}
                                className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                                style={{ background: '#f8faff' }}
                            />

                            <motion.button
                                onClick={sendMessage}
                                disabled={!input.trim()}
                                whileTap={{ scale: 0.9 }}
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                    background: input.trim()
                                        ? 'linear-gradient(135deg,#4E5BFF,#1976D2)'
                                        : '#e2e8f0',
                                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={input.trim() ? '#fff' : '#94a3b8'}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Mobile responsive styles ─────────────────────────────────── */}
            <style>{`
                @media (max-width: 640px) {
                    /* On mobile: full-screen-ish chat */
                    [data-community-chat="modal"] {
                        width: 95vw !important;
                        height: 85vh !important;
                    }
                }
                /* Dark mode support */
                html.dark [data-community-chat="modal"] {
                    --chat-bg: #1e293b;
                }
                html.dark .community-input {
                    background: #0f172a !important;
                    border-color: #334155 !important;
                    color: #e2e8f0 !important;
                }
            `}</style>
        </>
    )
}

export default CommunityChat
