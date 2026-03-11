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

  // Draggable position (left, top in px)
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 76,
    y: Math.max(0, window.innerHeight / 2 - 28),
  }));
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const dragOrigin = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

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

  // Mouse drag
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragOrigin.current.mouseX;
      const dy = e.clientY - dragOrigin.current.mouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 56, dragOrigin.current.posX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 56, dragOrigin.current.posY + dy)),
      });
    };
    const onMouseUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Touch drag
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const t = e.touches[0];
      const dx = t.clientX - dragOrigin.current.mouseX;
      const dy = t.clientY - dragOrigin.current.mouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
      e.preventDefault();
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 56, dragOrigin.current.posX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 56, dragOrigin.current.posY + dy)),
      });
    };
    const onTouchEnd = () => { isDragging.current = false; };
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleButtonMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    dragOrigin.current = { mouseX: e.clientX, mouseY: e.clientY, posX: pos.x, posY: pos.y };
    e.preventDefault();
  };

  const handleButtonTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    isDragging.current = true;
    hasMoved.current = false;
    dragOrigin.current = { mouseX: t.clientX, mouseY: t.clientY, posX: pos.x, posY: pos.y };
  };

  const handleButtonClick = () => {
    if (!hasMoved.current) setIsOpen(prev => !prev);
  };

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
      {isOpen && (() => {
        const PANEL_W = 380;
        const PANEL_H = 520;
        const isRightSide = pos.x + 28 > window.innerWidth / 2;
        const panelLeft = isRightSide
          ? Math.max(8, pos.x - PANEL_W - 16)
          : pos.x + 56 + 16;
        const panelTop = Math.max(8, Math.min(window.innerHeight - PANEL_H - 8, pos.y + 28 - PANEL_H / 2));
        return (
        <div
          ref={chatPanelRef}
          style={{ left: panelLeft, top: panelTop, width: PANEL_W, height: PANEL_H }}
          className="fixed z-[9999] max-w-[calc(100vw-120px)] max-h-[calc(100vh-120px)] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300"
        >
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
        );
      })()}

      {/* ─── Floating Button ────────────────────────────────── */}
      <button
        ref={chatButtonRef}
        onMouseDown={handleButtonMouseDown}
        onTouchStart={handleButtonTouchStart}
        onClick={handleButtonClick}
        style={{ left: pos.x, top: pos.y }}
        className={`fixed z-[9999] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors duration-300 hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing select-none ${
          isOpen
            ? 'bg-[#364153]'
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
