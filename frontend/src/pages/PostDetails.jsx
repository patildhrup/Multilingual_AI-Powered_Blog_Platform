import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import {
    ArrowLeft, MessageSquare, ThumbsUp, Share2, Send, Sparkles, Wand2,
    Languages, BookOpen, Download, FileText, Link, Globe, Trash2, X,
    Play, Volume2, Maximize2, LogIn, LogOut, User, Loader2, Paperclip
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import AuthModal from '../components/AuthModal';
import Grammy from '../components/Grammy';
import { translateContent } from '../lib/lingo';
import { generateSummary, summarizeComments } from '../lib/ai';


export default function PostDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const currentLocale = useLingoLocale();
    const setLocale = setLingoLocale;

    const [post, setPost] = useState(null);
    const [translatedPost, setTranslatedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [userName, setUserName] = useState(''); // Kept for legacy compatibility if needed, but we use user.email
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [translating, setTranslating] = useState(false);
    const [feedbackSummary, setFeedbackSummary] = useState('');
    const [postSummary, setPostSummary] = useState('');
    const [summarizing, setSummarizing] = useState(false);
    const [summarizingPost, setSummarizingPost] = useState(false);
    const [attachmentSummaries, setAttachmentSummaries] = useState({});
    const [summarizingAttachment, setSummarizingAttachment] = useState({});
    const [readerOpen, setReaderOpen] = useState(false);
    const [readingContent, setReadingContent] = useState('');
    const [readingTitle, setReadingTitle] = useState('');
    const [loadingReader, setLoadingReader] = useState(false);


    const t = (key) => {
        return dictionary && dictionary[key] ? dictionary[key] : key;
    };

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, [id]);

    useEffect(() => {
        if (post) {
            handleTranslation();
        }
    }, [currentLocale, post]);

    const fetchPost = async () => {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching post:', error);
            navigate('/');
        } else {
            // Ensure metadata is a proper object
            let processedData = { ...data };
            if (!processedData.metadata) {
                processedData.metadata = { attachments: [] };
            } else if (typeof data.metadata === 'string') {
                try {
                    processedData.metadata = JSON.parse(data.metadata);
                } catch (e) {
                    console.error('Error parsing metadata:', e);
                    processedData.metadata = { attachments: [] };
                }
            }
            // Ensure attachments is always an array
            if (!Array.isArray(processedData.metadata?.attachments)) {
                processedData.metadata.attachments = [];
            }

            setPost(processedData);
            setTranslatedPost(processedData);
        }
    };

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('blog_id', id)
            .order('created_at', { ascending: true });


        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            setComments(data);
        }
        setLoading(false);
    };

    const handleTranslation = async () => {
        if (!post) return;
        if (post.base_lang === currentLocale) {
            setTranslatedPost(post);
            return;
        }

        setTranslating(true);
        const translated = await translateContent(
            { title: post.title, content: post.content },
            post.base_lang,
            currentLocale
        );
        setTranslatedPost({ ...post, ...translated });
        setTranslating(false);
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment || !user) {
            if (!user) setIsAuthModalOpen(true);
            return;
        }

        const { data, error } = await supabase
            .from('comments')
            .insert([{
                blog_id: id,
                user_id: user.id,
                comment_text: newComment,
                original_language: currentLocale || 'en'
            }])
            .select();


        if (!error) {
            setComments([...comments, data[0]]);
            setNewComment('');
        }
    };

    const handleSummarizeFeedback = async () => {
        setSummarizing(true);
        const summary = await summarizeComments(comments, currentLocale);
        setFeedbackSummary(summary);
        setSummarizing(false);
    };

    const handleSummarizePost = async () => {
        if (!post) return;
        setSummarizingPost(true);
        const summary = await generateSummary(post.content, currentLocale);
        setPostSummary(summary);
        setSummarizingPost(false);
    };

    const handleReadDocument = async (attach) => {
        setReadingTitle(attach.name);
        setReaderOpen(true);
        setLoadingReader(true);
        setReadingContent('');

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/extract-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl: attach.url,
                    fileName: attach.name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to extract content');
            }

            if (data.content) {
                setReadingContent(data.content);
            } else {
                setReadingContent('No readable content found in this document.');
            }
        } catch (error) {
            console.error('Extraction failed:', error);
            setReadingContent(`Failed to load document content: ${error.message}. Please ensure the document is public and try again.`);
        } finally {
            setLoadingReader(false);
        }
    };

    const handleAttachmentSummary = async (attach) => {
        if (summarizingAttachment[attach.url]) return;

        setSummarizingAttachment(prev => ({ ...prev, [attach.url]: true }));
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/summarize-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl: attach.url,
                    fileName: attach.name,
                    locale: currentLocale || 'en'
                })
            });

            if (response.ok) {
                const data = await response.json();
                setAttachmentSummaries(prev => ({ ...prev, [attach.url]: data.response }));
            }
        } catch (error) {
            console.error('Attachment summary failed:', error);
        } finally {
            setSummarizingAttachment(prev => ({ ...prev, [attach.url]: false }));
        }
    };

    const getYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans pb-20">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={() => navigate('/')} className="text-[#94a3b8] hover:text-white flex items-center gap-2">
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <div className="flex items-center gap-4">
                        <select
                            value={currentLocale || ""}
                            onChange={(e) => setLocale(e.target.value)}
                            className="bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="en">English (US)</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="ja">Japanese (日本語)</option>
                            <option value="fr">French (Français)</option>
                            <option value="es">Spanish (Español)</option>
                        </select>

                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-[#94a3b8] hidden md:block">{user.email}</span>
                                <button
                                    onClick={signOut}
                                    className="p-2 bg-[#1e293b] hover:bg-red-500/10 hover:text-red-400 text-[#94a3b8] rounded-xl transition-all border border-[#334155]"
                                    title="Sign Out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                            >
                                <LogIn size={18} />
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />


            <main className="max-w-3xl mx-auto px-6 py-16">
                <article className="prose prose-invert prose-indigo max-w-none">
                    <div className="flex items-center gap-4 mb-8">
                        <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm font-bold uppercase">
                            {post.base_lang} → {currentLocale}
                        </span>
                        {translating && <span className="flex items-center gap-2 text-indigo-400 text-sm animate-pulse"><Globe size={14} /> Translating...</span>}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-10 leading-tight">
                        {translatedPost.title}
                    </h1>

                    <div className="flex items-center gap-3 mb-12 py-6 border-y border-[#1e293b]">
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">A</div>
                        <div>
                            <p className="font-bold text-lg">Author Name</p>
                            <p className="text-[#64748b] text-sm">{new Date(post.created_at).toLocaleDateString()} • 5 min read</p>
                        </div>
                    </div>

                    <div className="text-xl md:text-2xl leading-relaxed text-[#cbd5e1] whitespace-pre-wrap mb-12">
                        {translatedPost.content}
                    </div>

                    {/* Attachments Section */}
                    {post.metadata?.attachments?.length > 0 && (
                        <div className="mb-12 space-y-6">
                            <h4 className="text-lg font-bold flex items-center gap-2 text-[#94a3b8]">
                                <Paperclip size={18} className="text-indigo-400" />
                                Attachments & Media
                            </h4>
                            <div className="grid grid-cols-1 gap-6">
                                {post.metadata.attachments.map((attach, idx) => {
                                    const ytId = attach.type === 'link' ? getYouTubeId(attach.url) : null;
                                    const isDocLink = attach.type === 'link' && (attach.url.toLowerCase().endsWith('.pdf') || attach.url.toLowerCase().endsWith('.docx'));

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-[#1e293b]/50 border border-[#334155] rounded-[2rem] overflow-hidden hover:border-indigo-500/30 transition-all group/card shadow-xl"
                                        >
                                            {/* Photo UI */}
                                            {attach.type === 'photo' && (
                                                <div className="relative aspect-video overflow-hidden">
                                                    <img
                                                        src={attach.url}
                                                        alt={attach.name}
                                                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://via.placeholder.com/800x450?text=Image+Not+Found';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-60"></div>
                                                    <div className="absolute bottom-4 left-6 flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-indigo-500/20 backdrop-blur-md rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                                            <Image size={16} />
                                                        </div>
                                                        <span className="text-sm font-bold text-white tracking-wide">{attach.name}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Video UI */}
                                            {attach.type === 'video' && (
                                                <div className="aspect-video bg-black relative group/video">
                                                    <video
                                                        src={attach.url}
                                                        controls
                                                        className="w-full h-full"
                                                    ></video>
                                                    <div className="absolute top-4 left-6 flex items-center gap-2 pointer-events-none">
                                                        <div className="w-8 h-8 bg-red-500/20 backdrop-blur-md rounded-lg flex items-center justify-center text-red-400 border border-red-500/30">
                                                            <Video size={16} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* YouTube UI */}
                                            {attach.type === 'link' && ytId && (
                                                <div className="aspect-video">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${ytId}`}
                                                        title="YouTube video player"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                    ></iframe >
                                                </div >
                                            )}

                                            {/* Link Card UI for generic links / doc links */}
                                            {
                                                attach.type === 'link' && !ytId && (
                                                    <div
                                                        className={`p-6 flex items-start gap-4 transition-all ${isDocLink ? 'cursor-pointer hover:bg-indigo-500/5' : ''}`}
                                                        onClick={() => isDocLink && handleReadDocument(attach)}
                                                    >
                                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border ${isDocLink ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            }`}>
                                                            {isDocLink ? <FileText size={32} /> : <Link size={32} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="font-bold text-xl mb-1 truncate text-white">{attach.name}</h5>
                                                            <p className={`text-sm break-all mb-2 ${isDocLink ? 'text-emerald-400/70' : 'text-[#64748b]'}`}>{attach.url}</p>
                                                            {isDocLink && (
                                                                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md font-black uppercase tracking-[0.1em] flex items-center gap-1 w-fit">
                                                                    <BookOpen size={10} /> Read Available
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            {/* Document UI */}
                                            {
                                                attach.type === 'document' && (
                                                    <div className="flex flex-col">
                                                        <div
                                                            className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6 cursor-pointer hover:bg-indigo-500/5 transition-all"
                                                            onClick={() => handleReadDocument(attach)}
                                                        >
                                                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-lg border border-emerald-500/20">
                                                                <FileText size={32} />
                                                            </div>
                                                            <div className="flex-1 min-w-0 text-center md:text-left">
                                                                <h5 className="font-bold text-xl mb-1 truncate text-white">{attach.name}</h5>
                                                                <p className="text-xs text-[#64748b] uppercase tracking-widest font-black mb-4">Document Asset</p>

                                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleReadDocument(attach);
                                                                        }}
                                                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                                                                    >
                                                                        <BookOpen size={18} />
                                                                        Read Document
                                                                    </button>
                                                                    <a
                                                                        href={attach.url}
                                                                        download
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="flex items-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white px-5 py-2.5 rounded-xl font-bold transition-all border border-[#334155]"
                                                                    >
                                                                        <Download size={18} />
                                                                        Download
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {attach.url.toLowerCase().endsWith('.pdf') && (
                                                            <div className="mx-6 mb-6 h-[500px] border border-[#334155] rounded-3xl overflow-hidden bg-white shadow-2xl">
                                                                <iframe
                                                                    src={`${attach.url}#toolbar=0`}
                                                                    className="w-full h-full"
                                                                    title="PDF Document"
                                                                ></iframe>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            }

                                            {/* Common Footer / Info */}
                                            <div className="p-6 pt-0 flex flex-col gap-4">
                                                {/* Summary Section */}
                                                {(attach.type === 'document' || attach.type === 'link') && (
                                                    <div className="mt-2">
                                                        {attachmentSummaries[attach.url] ? (
                                                            <div className="bg-[#0f172a] p-4 rounded-2xl border border-indigo-500/20 relative group/summary">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                                                        <Sparkles size={10} /> AI Summary
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setAttachmentSummaries(prev => {
                                                                            const next = { ...prev };
                                                                            delete next[attach.url];
                                                                            return next;
                                                                        })}
                                                                        className="text-[#475569] hover:text-white transition-colors"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                                <p className="text-[#94a3b8] text-sm leading-relaxed italic">
                                                                    {attachmentSummaries[attach.url]}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAttachmentSummary(attach)}
                                                                disabled={summarizingAttachment[attach.url]}
                                                                className="w-full flex items-center justify-center gap-3 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-2xl text-sm font-bold transition-all border border-indigo-500/20 disabled:opacity-50"
                                                            >
                                                                {summarizingAttachment[attach.url] ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <Sparkles size={16} />
                                                                )}
                                                                {summarizingAttachment[attach.url] ? 'AI is analyzing...' : 'Generate AI Summary'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between border-t border-[#334155] pt-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${attach.type === 'photo' ? 'bg-pink-400' : attach.type === 'video' ? 'bg-purple-400' : attach.type === 'link' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                                                        <span className="text-[10px] text-[#64748b] uppercase font-black tracking-widest">{attach.type}</span>
                                                    </div>
                                                    <a
                                                        href={attach.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-[#334155] hover:border-indigo-400 shadow-lg"
                                                    >
                                                        <Globe size={14} />
                                                        View Original
                                                    </a>
                                                </div>
                                            </div>
                                        </motion.div >
                                    );
                                })}
                            </div >
                        </div >
                    )}

                    {/* AI Post Summary Section */}
                    <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold flex items-center gap-2">
                                <Sparkles className="text-indigo-400" size={18} />
                                AI Post Summary
                            </h4>
                            <button
                                onClick={handleSummarizePost}
                                disabled={summarizingPost}
                                className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                {summarizingPost ? 'Summarizing...' : 'Generate Summary'}
                            </button>
                        </div>
                        <AnimatePresence>
                            {postSummary ? (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-[#94a3b8] italic leading-relaxed"
                                >
                                    {postSummary}
                                </motion.p>
                            ) : (
                                <p className="text-[#475569] text-sm italic">
                                    Click generate for an AI-powered overview of this post.
                                </p>
                            )}
                        </AnimatePresence>
                    </div>
                </article >

                {/* AI Feedback Section */}
                < section className="mt-20 p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden" >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={100} className="text-indigo-400" />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                            <Sparkles className="text-indigo-400" />
                            {t("ai.feedbackTitle")}
                        </h3>
                        <button
                            onClick={handleSummarizeFeedback}
                            disabled={summarizing || comments.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                        >
                            {summarizing ? 'Summarizing...' : 'Summarize All Feedback'}
                        </button>
                    </div>

                    <AnimatePresence>
                        {feedbackSummary && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0f172a]/50 p-6 rounded-2xl text-indigo-100 italic leading-relaxed"
                            >
                                "{feedbackSummary}"
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!feedbackSummary && <p className="text-[#94a3b8] italic">Click summarize to get an AI-powered overview of what readers think in {currentLocale}.</p>}
                </section >

                {/* Comments Section */}
                < section className="mt-20" >
                    <h3 className="text-3xl font-bold mb-10 flex items-center gap-3">
                        <MessageSquare className="text-indigo-400" />
                        Responses ({comments.length})
                    </h3>

                    <div className="bg-[#1e293b] p-8 rounded-3xl border border-[#334155] mb-12">
                        {!user && (
                            <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                                <p className="text-indigo-200 text-sm font-medium">Please sign in to join the conversation.</p>
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl font-bold text-xs transition-all"
                                >
                                    Sign In Now
                                </button>
                            </div>
                        )}
                        <form onSubmit={handlePostComment} className="space-y-6">
                            <div className="relative group">
                                <textarea
                                    placeholder={user ? "What are your thoughts?" : "Sign in to share your thoughts..."}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    disabled={!user}
                                    className="bg-[#0f172a] border border-[#334155] rounded-2xl px-6 py-4 w-full h-32 outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all placeholder-[#475569] font-medium disabled:opacity-50"
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                                        Posting in {currentLocale}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-[#64748b] text-xs flex items-center gap-2">
                                    <Globe size={14} />
                                    AI-powered translation enabled
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newComment || !user}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                                >
                                    <Send size={18} />
                                    Publish Response
                                </button>
                            </div>
                        </form>
                    </div>


                    <div className="space-y-6">
                        {comments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} targetLocale={currentLocale} />
                        ))}
                    </div>
                </section >
            </main >
            {/* Document Reader Modal */}
            < AnimatePresence >
                {readerOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setReaderOpen(false)}
                            className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-5xl h-full bg-[#0f172a] border border-[#1e293b] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-lg truncate text-white">{readingTitle}</h3>
                                        <p className="text-xs text-[#64748b] font-medium tracking-tight">Interactive Document Reader</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setReaderOpen(false)}
                                        className="p-2.5 bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white rounded-xl transition-all border border-[#334155]"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                                {loadingReader ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <FileText size={24} className="text-indigo-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-white mb-1">Extracting Knowledge</p>
                                            <p className="text-[#64748b]">Please wait while we process the document contents...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-3xl mx-auto">
                                        <article className="prose prose-invert prose-indigo max-w-none">
                                            <div className="mb-8 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-4">
                                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 mt-1">
                                                    <Sparkles size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-indigo-100/80 italic leading-relaxed">
                                                        This content was extracted from the document using our AI-powered engine. Formatting may vary from the original file.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="whitespace-pre-wrap text-lg text-indigo-50 leading-relaxed font-serif tracking-tight">
                                                {readingContent}
                                            </div>
                                        </article>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-[#1e293b] bg-[#020617]/50 flex items-center justify-center">
                                <p className="text-xs text-[#475569] font-medium uppercase tracking-[0.2em]">End of Document</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 20px;
                    border: 2px solid #0f172a;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            ` }} />
            <Grammy mode="viewer" baseLang={currentLocale} />
        </div>
    );
}

function CommentItem({ comment, targetLocale }) {
    const [displayContent, setDisplayContent] = useState(comment.comment_text);
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
        translateComment();
    }, [targetLocale, comment.comment_text]);

    const translateComment = async () => {
        if (targetLocale === comment.original_language) {
            setDisplayContent(comment.comment_text);
            return;
        }
        setTranslating(true);
        const translated = await translateContent(comment.comment_text, comment.original_language, targetLocale);
        setDisplayContent(translated);
        setTranslating(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1e293b] p-6 rounded-3xl border border-[#334155] transition-all hover:border-indigo-500/30 group"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
                        <User size={20} className="text-indigo-400" />
                    </div>
                    <div>
                        <p className="font-bold text-[#f8fafc]">User {comment.user_id?.slice(0, 5) || 'Anonymous'}</p>
                        <p className="text-[#64748b] text-xs font-medium">{new Date(comment.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="bg-[#0f172a] px-3 py-1 rounded-full border border-[#334155] text-[10px] font-black uppercase text-[#475569] tracking-wider">
                    {comment.original_language}
                </div>
            </div>
            <div className="relative min-h-[1.5rem]">
                <AnimatePresence mode="wait">
                    {translating ? (
                        <motion.div
                            key="translating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center gap-2 text-indigo-400 text-xs font-bold italic"
                        >
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                            Translating...
                        </motion.div>
                    ) : (
                        <motion.p
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[#e2e8f0] leading-relaxed font-medium"
                        >
                            {displayContent}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

