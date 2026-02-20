import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { translateContent } from '../lib/lingo';
import { generateSummary, summarizeComments } from '../lib/ai';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { ArrowLeft, MessageSquare, Sparkles, User, Send, Globe, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


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
            setPost(data);
            setTranslatedPost(data);
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

                    <p className="text-xl md:text-2xl leading-relaxed text-[#cbd5e1] whitespace-pre-wrap">
                        {translatedPost.content}
                    </p>

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
                </article>

                {/* AI Feedback Section */}
                <section className="mt-20 p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden">
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
                </section>

                {/* Comments Section */}
                <section className="mt-20">
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
                </section>
            </main>
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

