import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { assets } from '../assets/assets'

// --- ICONS ---
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
  </svg>
);

const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9V9z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const BroomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 01-8 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v10" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

// --- Time Utility Function ---
const timeAgo = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// --- Animated Chat Button ---
const AnimatedChatButton = ({ onClick }) => {
  return (
    <button 
      className="relative flex justify-end items-center bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-500 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-shadow duration-300 cursor-pointer"
      onClick={onClick}
      aria-label="Open AI Chat"
    >
      <div className="flex items-center animate-slide-in-out-text overflow-hidden whitespace-nowrap">
        <span className="pl-6 pr-4 text-white text-base font-medium">
          ask Vaidyam AI
        </span>
      </div>
      <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-800 text-white rounded-full">
        <SparklesIcon />
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping-slow"></span>
      </div>
    </button>
  );
};

// --- Suggested Prompts ---
const SuggestedPrompts = ({ onPromptClick }) => {
  const prompts = [
    "What are common cold symptoms?",
    "Tips for a healthy diet.",
    "How much sleep do I need?",
    "Explain stress management.",
  ];

  return (
    <div className="px-4 py-2 animate-fade-in-up">
      <p className="text-sm font-medium text-gray-500 mb-3 text-center">
        Or try one of these:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="text-left text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-100 transition-all duration-200"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Chat Message ---
const ChatMessage = ({ msg, onCopy, isCopied, isExpanded }) => {
  const isUser = msg.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}>
      <div className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"}`}>
          {isUser ? <UserIcon /> : <BotIcon />}
        </div>
        
        {/* Message Bubble */}
        <div className="flex flex-col">
          <div className={`${isUser ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm" : "bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm"} px-4 py-3 message-bubble`}>
            
            {/* --- IMAGE DISPLAY LOGIC --- */}
            {/* Only show image if user sent it AND we are in Expanded mode */}
            {msg.image && isExpanded && (
              <div className="mb-2">
                 <img src={msg.image} alt="uploaded" className="chat-image-thumb" />
              </div>
            )}

            <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : ""}`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
          
          {/* Timestamp and Copy */}
          {msg.timestamp && (
            <div className={`flex items-center justify-between mt-1.5 ${isUser ? 'flex-row-reverse' : ''}`}>
              <span className={`text-xs text-gray-400`}>
                {timeAgo(msg.timestamp)}
              </span>
              {!isUser && (
                <button
                  onClick={() => onCopy(msg.text)}
                  className="text-gray-400 hover:text-blue-600 transition-all p-1 rounded-md"
                  aria-label="Copy message"
                >
                  {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---
const PatientAIChat = () => {
  const [chatState, setChatState] = useState("closed"); // 'closed', 'mini', 'expanded'
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I'm your AI health assistant. How can I help you today?", timestamp: new Date() },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  
  // --- NEW IMAGE STATE ---
  const [selectedImage, setSelectedImage] = useState(null);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll logic
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedImage]); // Also scroll when image preview appears

  // Resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  // Overflow handling
  useEffect(() => {
    if (chatState === "expanded") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [chatState]);

  // Cleanup
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch (e) {}
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Copy Logic
  const handleCopy = async (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedText(text);
      setTimeout(() => setCopiedText(""), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handlePromptClick = (prompt) => {
    setInputMessage(prompt);
    textareaRef.current?.focus();
  };

  const handleStopGenerating = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
  };

  const handleClearChat = () => {
    setMessages([{ sender: "ai", text: "Chat cleared! How can I help you start fresh?", timestamp: new Date() }]);
    setSelectedImage(null);
  };

  // --- IMAGE HELPERS ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  // --- VOICE LOGIC ---
  const [isListening, setIsListening] = useState(false);
  const [timer, setTimer] = useState(0);
  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser does not support Speech Recognition.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setTimer(0);
      timerIntervalRef.current = setInterval(() => setTimer(p => p + 1), 1000);
    };

    recognitionRef.current.onresult = (event) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        final += event.results[i][0].transcript;
      }
      setInputMessage(final);
    };

    recognitionRef.current.onerror = () => stopListening();
    recognitionRef.current.onend = () => stopListening();
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    clearInterval(timerIntervalRef.current);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- SEND LOGIC ---
  const handleSend = async () => {
    // Only allow sending if text exists OR (image exists AND state is expanded)
    const hasText = inputMessage.trim().length > 0;
    const hasImage = !!selectedImage;
    const canSendImage = chatState === 'expanded';

    if (!hasText && (!hasImage || !canSendImage)) return;

    // Construct new message
    const newMessage = {
      sender: "user",
      text: inputMessage,
      timestamp: new Date(),
      // Attach image only if we are in expanded mode
      image: canSendImage ? selectedImage : null 
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInputMessage("");
    
    // Store image for request, then clear state
    const imageToSend = canSendImage ? selectedImage : null;
    setSelectedImage(null);
    setLoading(true);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: newMessage.text,
          image: imageToSend // Send base64 to backend
        }),
        signal: signal
      });

      const data = await res.json();
      const replyText = data.success ? data.reply.replace(/\\n/g, "\n") : `AI Error: ${data.reply}`;
      setMessages([...newMessages, { sender: "ai", text: replyText, timestamp: new Date() }]);

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setMessages([...newMessages, { sender: "ai", text: "Error connecting to AI service.", timestamp: new Date() }]);
      }
    }
    setLoading(false);
    abortControllerRef.current = null;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 1. FLOATING BUTTON (Closed) */}
      {chatState === 'closed' && (
        <div className="fixed bottom-6 right-6 z-50">
          <AnimatedChatButton onClick={() => setChatState('mini')} />
        </div>
      )}

      {/* 2. MINI CHAT (20% View - NO PHOTO OPTIONS) */}
      {chatState === 'mini' && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-slide-in border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-5 py-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"><SparklesIcon /></div>
                <div><span className="font-semibold block">AI Assistant</span></div>
             </div>
             <div className="flex gap-1">
               <button onClick={handleClearChat} className="hover:bg-white/20 p-2 rounded-lg"><BroomIcon /></button>
               <button onClick={() => setChatState('expanded')} className="hover:bg-white/20 p-2 rounded-lg"><ExpandIcon /></button>
               <button onClick={() => setChatState('closed')} className="hover:bg-white/20 p-2 rounded-lg"><CloseIcon /></button>
             </div>
          </div>

          {/* Messages (Images HIDDEN in mini mode) */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 custom-scrollbar">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} msg={msg} onCopy={handleCopy} isCopied={copiedText === msg.text} isExpanded={false} />
              ))}
              {loading && <div className="text-gray-500 text-sm ml-2">AI is typing...</div>}
              <div ref={bottomRef}></div>
            </div>
            {messages.length === 1 && !loading && <SuggestedPrompts onPromptClick={handlePromptClick} />}
          </div>

          {/* Input (NO Gallery Icon) */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2 outline-none resize-none max-h-32 text-sm"
              />
              <button onClick={handleSend} className="bg-blue-600 text-white p-3 rounded-xl">
                 <SendIcon />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EXPANDED CHAT (80-90% View - WITH PHOTO OPTIONS) */}
      {chatState === 'expanded' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="w-full h-full max-w-[90vw] max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-gray-300">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/20 rounded-xl"><SparklesIcon /></div>
                 <div><h2 className="font-bold text-xl">AI Health Assistant</h2></div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleClearChat} className="hover:bg-white/20 p-2.5 rounded-lg"><BroomIcon /></button>
                <button onClick={() => setChatState('mini')} className="hover:bg-white/20 p-2.5 rounded-lg"><MinimizeIcon /></button>
                <button onClick={() => setChatState('closed')} className="hover:bg-white/20 p-2.5 rounded-lg"><CloseIcon /></button>
              </div>
            </div>

            {/* Messages (Images VISIBLE) */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg, idx) => (
                  <ChatMessage key={idx} msg={msg} onCopy={handleCopy} isCopied={copiedText === msg.text} isExpanded={true} />
                ))}
                {loading && <div className="text-gray-500 ml-4 animate-pulse">Analyzing...</div>}
                <div ref={bottomRef}></div>
              </div>
              {messages.length === 1 && !loading && <div className="max-w-4xl mx-auto"><SuggestedPrompts onPromptClick={handlePromptClick} /></div>}
            </div>

            {/* Input Area (WITH Gallery & Preview) */}
            <div className="p-6 bg-white border-t border-gray-200 flex-shrink-0">
               {/* Use the CSS structure you requested */}
               <div className="max-w-4xl mx-auto search-box">
                  
                  {/* Image Preview Container (Only if image selected) */}
                  {selectedImage && (
                    <div className="image-preview-container">
                      <img src={selectedImage} alt="preview" className="pending-image-thumb" />
                      <button onClick={removeImage} className="pending-image-remove">
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                      </button>
                    </div>
                  )}

                  <div className="input-row">
                    <textarea 
                       ref={textareaRef}
                       value={inputMessage} 
                       onChange={(e) => setInputMessage(e.target.value)}
                       onKeyDown={handleKeyDown}
                       placeholder="Ask about symptoms or upload a medical image..."
                       rows={1}
                       className="resize-none max-h-40" // Styling handled by search-box input css mostly
                    />
                    
                    <div className="search-actions">
                       {/* Hidden Input */}
                       <input 
                          type="file" 
                          accept="image/*" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          className="hidden" 
                       />
                       
                       {/* Gallery Button */}
                       <div onClick={() => fileInputRef.current.click()} title="Upload Image">
                                <img className='w-5' src={assets.gallery_icon} alt="" />
                       </div>

                       {/* Mic Button */}
                       <div onClick={startListening} title="Voice Input" className="cursor-pointer text-gray-500 hover:text-blue-600 hover:scale-110 transition-all">
                          <MicIcon />
                       </div>

                       {/* Send Button */}
                       {loading ? (
                         <div onClick={handleStopGenerating} className="cursor-pointer text-red-500"><StopIcon /></div>
                       ) : (
                         <div onClick={handleSend} className={`cursor-pointer ${(!inputMessage && !selectedImage) ? 'opacity-50' : 'text-blue-600'}`}><SendIcon /></div>
                       )}
                    </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      )}

      {/* Listening Overlay */}
      {isListening && (
        <div className="voice-overlay" onClick={stopListening}>
           <div className="voice-content">
             <h2>Listening...</h2>
             <p>{formatTime(timer)}</p>
             <div className="voice-wave">
               <span></span><span></span><span></span><span></span><span></span>
             </div>
             <p className="tap-to-stop">Tap to Stop</p>
           </div>
        </div>
      )}

      {/* --- INJECTING YOUR SPECIFIC CSS --- */}
      <style>{`
        /* --- COPY PASTE FROM YOUR GEMINI CLONE CSS --- */
        
        /* 1. The Container */
        .search-box {
           display: flex;
           flex-direction: column;
           align-items: flex-start;
           justify-content: center;
           width: 100%;
           max-width: 900px;
           padding: 12px 20px;
           margin: 0 auto;
           background-color: #f0f4f9;
           border-radius: 30px;
           transition: all 0.3s ease;
           position: relative; /* Context for preview */
        }

        /* 2. Input Row */
        .input-row {
           width: 100%;
           display: flex;
           align-items: center;
           justify-content: space-between;
           gap: 10px;
        }

        .search-box textarea {
           flex: 1;
           background: transparent;
           border: none;
           outline: none;
           padding: 4px 8px;
           font-size: 18px;
        }

        .search-actions {
           display: flex;
           align-items: center;
           gap: 15px;
        }
        
        .search-actions svg, .search-actions img {
           cursor: pointer;
           transition: transform 0.2s;
        }
        
        .search-actions svg:hover, .search-actions img:hover {
           transform: scale(1.1);
        }

        /* 3. Image Preview Styles */
        .image-preview-container {
           position: relative;
           display: inline-block;
           margin-bottom: 12px;
           margin-left: 5px;
           animation: fadeIn 0.3s ease;
        }

        .pending-image-thumb {
           width: 60px;
           height: 60px;
           object-fit: cover;
           border-radius: 12px;
           border: 1px solid #e0e0e0;
           display: block;
        }

        .pending-image-remove {
           position: absolute;
           top: -6px;
           right: -6px;
           background: #3c4043;
           color: white;
           border: none;
           border-radius: 50%;
           width: 22px;
           height: 22px;
           cursor: pointer;
           display: flex;
           align-items: center;
           justify-content: center;
           padding: 0;
           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
           transition: background 0.2s, transform 0.1s;
           z-index: 2;
        }
        
        .pending-image-remove:hover {
           background: #5f6368;
           transform: scale(1.05);
        }
        
        .pending-image-remove svg {
           width: 14px;
           height: 14px;
           fill: currentColor;
        }

        /* 4. Chat History Image */
        .chat-image-thumb {
           width: 200px !important;
           height: auto;
           border-radius: 20px !important;
           object-fit: contain;
           margin-bottom: 10px;
           border: 2px solid #e5e5e5;
           animation: fadeIn 0.2s ease;
        }

        /* 5. Animations */
        @keyframes fadeIn {
           from { opacity: 0; transform: translateY(5px); }
           to { opacity: 1; transform: translateY(0); }
        }

        /* 6. Voice Overlay from your CSS */
        .voice-overlay {
           position: fixed; top: 0; left: 0; width: 100%; height: 100%;
           background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(3px);
           z-index: 9999; display: flex; justify-content: center; align-items: center;
           flex-direction: column; animation: fadeIn 0.4s ease-out; cursor: pointer;
        }
        .voice-content h2 { color: #fff; font-size: 28px; margin:0; }
        .voice-content p { color: #eee; font-size: 18px; margin-top:5px; font-family: monospace; }
        .voice-wave { display: flex; gap: 6px; height: 30px; align-items: center; margin-top: 20px; }
        .voice-wave span { width: 4px; background: #fff; border-radius: 10px; animation: soundWave 1s infinite ease-in-out; }
        .voice-wave span:nth-child(1) { height: 10px; animation-delay: 0.1s; }
        .voice-wave span:nth-child(2) { height: 25px; animation-delay: 0.2s; }
        .voice-wave span:nth-child(3) { height: 15px; animation-delay: 0.3s; }
        .voice-wave span:nth-child(4) { height: 25px; animation-delay: 0.4s; }
        .voice-wave span:nth-child(5) { height: 10px; animation-delay: 0.5s; }
        @keyframes soundWave { 0%, 100% { height: 10px; opacity: 0.5; } 50% { height: 30px; opacity: 1; } }
        .tap-to-stop { position: absolute; bottom: 50px; color: #ddd; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }

        /* Animation utilities */
        .animate-slide-in-out-text { animation: slide-in-out-text 6s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 3s infinite; }
        .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0,0,0.2,1) infinite; }
        .animate-slide-in { animation: slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        
        /* Keyframes */
        @keyframes slide-in-out-text { 0% { width:0; opacity:0; } 30% { width:150px; opacity:1; } 70% { width:150px; opacity:1; } 100% { width:0; opacity:0; } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes ping-slow { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.3); opacity: 0; } 100% { transform: scale(1.3); opacity: 0; } }
        @keyframes slide-in { from { transform: translateY(20px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #3b82f6, #6366f1); border-radius: 10px; }
        
        /* Markdown Prose */
        .prose p { margin-top: 0; margin-bottom: 0.5em; }
        .prose p:last-child { margin-bottom: 0; }
      `}</style>
    </>
  );
};

export default PatientAIChat;