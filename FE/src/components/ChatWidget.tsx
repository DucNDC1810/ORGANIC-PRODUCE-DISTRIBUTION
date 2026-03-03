import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Leaf, Bot, User } from 'lucide-react';
import { chatService } from '../services/chatService';
import { useCart } from '../context/CartContext';

// Only show chat widget on these routes
const ALLOWED_ROUTES = ['/', '/products', '/product', '/about', '/blogs'];

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 0,
  text: 'Hi! I\'m Organica Assistant 🌿\nAsk me about organic products, healthy eating, or anything on our website!',
  sender: 'bot',
  timestamp: new Date(),
};

export default function ChatWidget() {
  const { pathname } = useLocation();
  const { isCartOpen } = useCart();
  const isVisible = ALLOWED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(1);

  // Close chat panel when navigating to a non-allowed page
  useEffect(() => {
    if (!isVisible) setIsOpen(false);
  }, [isVisible]);

  // Close chat when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        chatPanelRef.current && !chatPanelRef.current.contains(target) &&
        chatButtonRef.current && !chatButtonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: nextId.current++,
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res: any = await chatService.sendMessage(text);
      const reply = res.reply ?? res.data?.reply ?? 'Sorry, I could not understand that.';

      const botMsg: Message = {
        id: nextId.current++,
        text: reply,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);
      if (!isOpen) setHasNewMessage(true);
    } catch {
      const errorMsg: Message = {
        id: nextId.current++,
        text: 'Sorry, something went wrong. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Don't render on non-product pages or when cart is open
  if (!isVisible || isCartOpen) return null;

  return (
    <>
      {/* ─── Chat Panel ─────────────────────────────────────── */}
      {isOpen && (
        <div ref={chatPanelRef} className="fixed right-24 top-1/2 -translate-y-1/2 z-[9999] w-[380px] max-w-[calc(100vw-120px)] h-[520px] max-h-[calc(100vh-120px)] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#00B207] to-[#2DC071] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Organica Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-[11px] text-green-100">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#F9FAFB]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.sender === 'bot'
                      ? 'bg-[#EDF2EE] text-[#00B207]'
                      : 'bg-[#00B207] text-white'
                  }`}
                >
                  {msg.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-[#00B207] text-white rounded-tr-sm'
                        : 'bg-white text-[#1F2937] shadow-sm border border-gray-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-[#EDF2EE] text-[#00B207]">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-xl px-3 py-1.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about organic products..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-[#1F2937] placeholder:text-gray-400 outline-none py-1.5 disabled:opacity-50"
                maxLength={1000}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg bg-[#00B207] text-white flex items-center justify-center hover:bg-[#009A06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Powered by Organica AI • Organic food only
            </p>
          </div>
        </div>
      )}

      {/* ─── Floating Button ────────────────────────────────── */}
      <button
        ref={chatButtonRef}
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed right-5 top-1/2 -translate-y-1/2 z-[9999] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-[#364153] rotate-0'
            : 'bg-gradient-to-br from-[#00B207] to-[#2DC071]'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {hasNewMessage && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </>
        )}
      </button>
    </>
  );
}
