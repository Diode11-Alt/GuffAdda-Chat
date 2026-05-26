import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, ArrowUpRight } from 'lucide-react';

const MESSAGES = [
  { id: 1, sender: 'system', text: 'Connection established. Protocol active.', time: '09:00', type: 'status' },
  { id: 2, sender: 'user1', text: 'Are we cleared for the update?', time: '09:02', type: 'message' },
  { id: 3, sender: 'user2', text: 'All systems go. Merging branches now.', time: '09:03', type: 'message' },
];

export default function AnimatedChat() {
  const [messages, setMessages] = useState(MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      sender: 'user1',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'message'
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'user2',
        text: 'Acknowledged. Processing the payload...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'message'
      }]);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#F0EBE1] font-mono selection:bg-[#FF4300] selection:text-[#0A0A0A] overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
        
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(30px) scale(0.98) skewY(1deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) skewY(0); }
        }
        
        .msg-enter {
          animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.8); opacity: 1; }
        }

        .dot-1 { animation: pulseDot 1.4s infinite ease-in-out; }
        .dot-2 { animation: pulseDot 1.4s infinite ease-in-out 0.2s; }
        .dot-3 { animation: pulseDot 1.4s infinite ease-in-out 0.4s; }

        .line-draw {
          animation: drawDown 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top;
        }

        @keyframes drawDown {
          0% { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Sidebar - Brutalist Editorial */}
      <aside className="w-1/3 border-r border-[#F0EBE1]/10 p-10 flex flex-col justify-between hidden md:flex relative z-10">
        <div>
          <h1 className="font-serif text-5xl italic tracking-tight mb-12">Discourse</h1>
          <nav className="space-y-6 text-sm tracking-widest uppercase opacity-70">
            <a href="#" className="group flex items-center gap-4 hover:text-[#FF4300] hover:opacity-100 transition-all duration-300">
              <span className="w-4 h-[1px] bg-current transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform"></span>
              <Hash size={14} /> Protocol_01
            </a>
            <a href="#" className="flex items-center gap-4 text-[#FF4300] opacity-100">
              <span className="w-4 h-[1px] bg-current"></span>
              <Hash size={14} /> Secure_Line
            </a>
          </nav>
        </div>
        
        <div className="text-xs opacity-30 uppercase tracking-widest flex justify-between items-end">
          <span>SYS.OP.24</span>
          <span>ENCRYPTED</span>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full">
        {/* Background typographic noise */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.015] flex items-center justify-center">
          <span className="font-serif text-[20vw] italic leading-none whitespace-nowrap">SECURE</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 md:px-24 py-16 space-y-20 scroll-smooth z-10 scrollbar-hide relative">
          {/* Timeline continuous line */}
          <div className="absolute left-[39px] md:left-[111px] top-0 bottom-0 w-[1px] bg-[#F0EBE1]/5 line-draw" />

          {messages.map((msg, idx) => {
            const isMe = msg.sender === 'user1';
            const isStatus = msg.type === 'status';

            return (
              <div 
                key={msg.id} 
                className={`msg-enter flex ${isStatus ? 'justify-center' : 'justify-start'} w-full`}
                style={{ animationDelay: \`\${idx * 0.15}s\` }}
              >
                {isStatus ? (
                  <div className="bg-[#F0EBE1] text-[#0A0A0A] text-xs uppercase tracking-widest py-2 px-6 font-bold">
                    {msg.text}
                  </div>
                ) : (
                  <div className={\`flex w-full \${isMe ? 'md:w-4/5 ml-auto' : 'w-full'} group\`}>
                    
                    {!isMe && (
                      <div className="w-12 pt-3 flex-shrink-0 flex justify-center relative bg-[#0A0A0A] z-10">
                        <div className="w-1.5 h-1.5 rounded-none bg-[#FF4300]" />
                      </div>
                    )}

                    <div className={\`flex-1 \${isMe ? 'text-right' : 'pl-8'}\`}>
                      <div className="text-[10px] uppercase tracking-widest text-[#F0EBE1]/40 mb-4 flex items-center gap-4">
                        {isMe && <span className="flex-1 h-[1px] bg-[#F0EBE1]/10 group-hover:bg-[#FF4300]/40 transition-colors duration-500" />}
                        <span>{isMe ? 'YOU' : 'AGENT'} / {msg.time}</span>
                        {!isMe && <span className="flex-1 h-[1px] bg-[#F0EBE1]/10 group-hover:bg-[#FF4300]/40 transition-colors duration-500" />}
                      </div>
                      <p className={\`text-xl md:text-[28px] leading-[1.6] \${isMe ? 'font-serif italic text-[#F0EBE1]' : 'font-mono text-[#F0EBE1]/80'} transition-colors duration-500 hover:text-[#FF4300]\`}>
                        {msg.text}
                      </p>
                    </div>

                    {isMe && (
                      <div className="w-12 pt-3 flex-shrink-0 flex justify-center relative bg-[#0A0A0A] z-10 ml-8">
                        <div className="w-1.5 h-1.5 rounded-none border border-[#F0EBE1]/50" />
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="msg-enter flex justify-start w-full">
              <div className="flex w-full">
                <div className="w-12 pt-3 flex-shrink-0 flex justify-center relative bg-[#0A0A0A] z-10">
                  <div className="w-1.5 h-1.5 rounded-none bg-[#F0EBE1]/30" />
                </div>
                <div className="pl-8 flex gap-3 items-center h-8">
                  <div className="w-1 h-1 bg-[#FF4300] rounded-none dot-1" />
                  <div className="w-1 h-1 bg-[#FF4300] rounded-none dot-2" />
                  <div className="w-1 h-1 bg-[#FF4300] rounded-none dot-3" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-10" />
        </div>

        {/* Input Area */}
        <div className="p-6 md:px-24 md:py-12 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent z-20">
          <form onSubmit={handleSend} className="relative flex items-center group">
            <span className="absolute left-0 text-[#FF4300] opacity-30 group-focus-within:opacity-100 transition-all duration-500 group-focus-within:translate-x-2">
              <ArrowUpRight size={24} strokeWidth={1} />
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Draft your message..."
              className="w-full bg-transparent border-b border-[#F0EBE1]/10 py-5 pl-14 pr-16 text-lg font-serif italic focus:outline-none focus:border-[#FF4300] transition-colors duration-500 placeholder:text-[#F0EBE1]/20 placeholder:font-serif placeholder:italic rounded-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#F0EBE1]/30 hover:text-[#FF4300] disabled:opacity-20 transition-colors duration-300"
            >
              <Send size={20} strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
