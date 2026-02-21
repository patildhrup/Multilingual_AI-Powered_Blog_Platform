import { useState, useRef, useEffect } from 'react';
import { useLingoLocale } from 'lingo.dev/react/client';
import { MessageSquare, X, Send, Loader2, Bot, User, Paperclip, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ChatBot() {
    const locale = useLingoLocale();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [attachment, setAttachment] = useState(null);
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
        if (e) e.preventDefault();
        if ((!input.trim() && !attachment) || loading) return;

        const userMessage = {
            role: 'user',
            content: attachment ? `[File: ${attachment.name}] ${input.trim() || 'Please summarize this document.'}` : input.trim()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            let response;
            if (attachment) {
                // Handle file/document summarization
                response = await fetch(`${BACKEND_URL}/api/summarize-document`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileUrl: attachment.url,
                        fileName: attachment.name,
                        locale: locale || 'en'
                    })
                });
            } else {
                response = await fetch(`${BACKEND_URL}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: userMessage.content,
                        locale: locale || 'en',
                        history: messages.slice(-10)
                    })
                });
            }

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Request failed');
            }

            const data = await response.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || data.summary || 'Summary generated.'
            }]);
            setAttachment(null);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // In a real app, you'd upload this to Supabase Storage first
        // For this demo/integration, let's assume we use a temporary upload or mock it
        // Since we have Supabase configured in the project, we'll try to use it if possible
        // But Blogy AI assistant might just need the text.
        // For now, let's just set the attachment state and handle it in sendMessage
        setLoading(true);
        try {
            // Mocking or simple upload logic - using the same bucket as blog posts for simplicity
            const { supabase } = await import('../lib/supabase');
            const fileExt = file.name.split('.').pop();
            const fileName = `ai-assistant/${Math.random()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('blog-attachments')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('blog-attachments')
                .getPublicUrl(fileName);

            setAttachment({ name: file.name, url: publicUrl });
        } catch (error) {
            console.error('Attachment error:', error);
            alert('Failed to attach file: ' + error.message);
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
                        className="mb-3 w-[400px] max-h-[500px] bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 flex flex-col overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Bot size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-black">Blogy AI</p>
                                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Assistant</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-black/20 hover:text-black"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[340px]">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
                                        <Bot size={28} className="text-indigo-600" />
                                    </div>
                                    <p className="text-base font-black text-black mb-1 italic">Blogy Writing Assistant</p>
                                    <p className="text-xs text-black/40 max-w-[260px] leading-relaxed font-medium">
                                        Ask me about writing, SEO, translations, content ideas, or anything blog-related!
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600'
                                        : 'bg-white border border-slate-100'
                                        }`}>
                                        {msg.role === 'user'
                                            ? <User size={14} className="text-white" />
                                            : <Bot size={14} className="text-indigo-600" />
                                        }
                                    </div>
                                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-md'
                                        : 'bg-slate-50 text-black border border-slate-100 rounded-tl-md font-medium'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                        <Bot size={14} className="text-indigo-600" />
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5 shadow-sm">
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                            {attachment && (
                                <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-indigo-600" />
                                        <span className="text-xs font-bold text-black/60 truncate max-w-[200px]">{attachment.name}</span>
                                    </div>
                                    <button onClick={() => setAttachment(null)} className="text-black/20 hover:text-black transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <form onSubmit={sendMessage} className="flex items-center gap-2">
                                <label className="p-3 hover:bg-white rounded-xl cursor-pointer transition-all text-black/20 hover:text-black shrink-0 border border-transparent hover:border-slate-200 shadow-sm hover:shadow-md">
                                    <Paperclip size={18} />
                                    <input type="file" className="hidden" onChange={handleFileChange} />
                                </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={attachment ? "Add instructions..." : "Ask anything..."}
                                    disabled={loading}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder-black/20 font-medium text-black disabled:opacity-50 shadow-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={(!input.trim() && !attachment) || loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-3 rounded-xl transition-all shrink-0 shadow-lg shadow-indigo-500/30"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 via-blue-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10 rounded-2xl"></div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setOpen(!open)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${open
                        ? 'bg-white border border-slate-200 text-black/20 hover:text-black'
                        : 'bg-indigo-600 text-white shadow-indigo-500/40 hover:bg-indigo-700'
                        }`}
                >
                    {open ? <X size={24} /> : <MessageSquare size={24} />}
                </motion.button>
            </motion.div>
        </div>
    );
}
