import { useState, useRef, useEffect } from 'react';
import { useLingoLocale } from 'lingo.dev/react/client';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ChatBot() {
    const locale = useLingoLocale();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    locale: locale || 'en',
                    history: messages.slice(-10)
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Chat failed');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="mb-3 w-[400px] max-h-[500px] bg-[#0f172a] border border-[#334155] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b] bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Bot size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#f8fafc]">Blogy AI</p>
                                    <p className="text-[10px] text-indigo-400 font-medium">Powered by Grok</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 hover:bg-[#1e293b] rounded-lg transition-colors text-[#94a3b8] hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[340px]">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-3">
                                        <Bot size={24} className="text-indigo-400" />
                                    </div>
                                    <p className="text-sm font-bold text-[#e2e8f0] mb-1">AI Writing Assistant</p>
                                    <p className="text-xs text-[#64748b] max-w-[260px] leading-relaxed">
                                        Ask me about writing, SEO, translations, content ideas, or anything blog-related!
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600'
                                            : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                    }`}>
                                        {msg.role === 'user'
                                            ? <User size={13} className="text-white" />
                                            : <Bot size={13} className="text-white" />
                                        }
                                    </div>
                                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-md'
                                            : 'bg-[#1e293b] text-[#e2e8f0] border border-[#334155] rounded-tl-md'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-2.5">
                                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                                        <Bot size={13} className="text-white" />
                                    </div>
                                    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={sendMessage} className="p-3 border-t border-[#1e293b] bg-[#0a0f1e]">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything..."
                                    disabled={loading}
                                    className="flex-1 bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-[#475569] font-medium disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shrink-0"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(!open)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
                    open
                        ? 'bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-white'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50'
                }`}
            >
                {open ? <X size={22} /> : <MessageSquare size={22} />}
            </motion.button>
        </div>
    );
}
