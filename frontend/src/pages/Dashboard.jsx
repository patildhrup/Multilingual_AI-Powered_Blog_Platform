import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { LANGUAGES } from '../lingo/dictionary';
import { translateContent } from '../lib/lingo';
import {
    generateTitle, generateSEODescription, generateHashtags,
    generateSummary, improveWriting, generateAllBlogContent
} from '../lib/ai';
import {
    BookOpen, PenTool, LogOut, User, Send, Globe, Sparkles,
    MessageSquare, ChevronLeft, ChevronRight, Plus, FileText,
    List, Hash, AlignLeft, Type, Loader2, Wand2, RefreshCw,
    Edit2, Trash2, Mic, Square, Play, Volume2,
    Image, Video, Link, Paperclip, X
} from 'lucide-react';
import Grammy from '../components/Grammy';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from '../components/LanguageSelector';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, loading: authLoading, signOut } = useAuth();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState('create');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [baseLang, setBaseLang] = useState('en');
    const [publishing, setPublishing] = useState(false);

    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [postSummary, setPostSummary] = useState('');
    const [summarizing, setSummarizing] = useState(false);

    const [aiLoading, setAiLoading] = useState({});
    const [aiResults, setAiResults] = useState({});
    const [attachments, setAttachments] = useState([]);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // Management & Voice State
    const [isEditing, setIsEditing] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const [speakingPostId, setSpeakingPostId] = useState(null);
    const [attachmentSummaries, setAttachmentSummaries] = useState({});
    const [summarizingAttachment, setSummarizingAttachment] = useState({});
    const [readerOpen, setReaderOpen] = useState(false);
    const [readingContent, setReadingContent] = useState('');
    const [readingTitle, setReadingTitle] = useState('');
    const [loadingReader, setLoadingReader] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Write your story...',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });

    // Update editor content if state changes (e.g. when editing a post)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [isEditing, editingPostId]); // Only sync when switching posts/modes to avoid cycles

    const t = (key) => dictionary?.[key] || key;

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) fetchPosts();
    }, [user]);

    const fetchPosts = async () => {
        setLoadingPosts(true);
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setPosts(data || []);
        setLoadingPosts(false);
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!title || !content) return;
        setPublishing(true);

        const postData = {
            title,
            content,
            base_lang: baseLang,
            user_id: user.id,
            metadata: { attachments }
        };

        let result;
        if (isEditing && editingPostId) {
            result = await supabase
                .from('posts')
                .update(postData)
                .eq('id', editingPostId)
                .select();
        } else {
            result = await supabase
                .from('posts')
                .insert([postData])
                .select();
        }

        if (!result.error && result.data) {
            setTitle('');
            setContent('');
            setAttachments([]);
            setAiResults({});
            setIsEditing(false);
            setEditingPostId(null);
            fetchPosts();
            setActiveView('posts');
        } else {
            console.error('Publishing failed:', result.error);
        }
        setPublishing(false);
    };

    const handleDelete = async (postId) => {
        if (!window.confirm(t("ui.confirmDelete") || "Are you sure you want to delete this post?")) return;
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (!error) {
            setPosts(posts.filter(p => p.id !== postId));
            if (selectedPost?.id === postId) {
                setActiveView('posts');
                setSelectedPost(null);
            }
        } else {
            console.error('Delete failed:', error);
        }
    };

    const handleEdit = (post) => {
        setTitle(post.title);
        setContent(post.content);
        setBaseLang(post.base_lang);
        setAttachments(post.metadata?.attachments || []);
        setIsEditing(true);
        setEditingPostId(post.id);
        setActiveView('create');
    };

    const handleSpeech = (post) => {
        if (speakingPostId === post.id) {
            window.speechSynthesis.cancel();
            setSpeakingPostId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`${post.title}. ${post.content}`);
        utterance.lang = post.base_lang === 'en' ? 'en-US' : post.base_lang;
        utterance.onend = () => setSpeakingPostId(null);
        utterance.onerror = () => setSpeakingPostId(null);

        setSpeakingPostId(post.id);
        window.speechSynthesis.speak(utterance);
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
                    locale: locale || 'en'
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

    const selectPost = async (post) => {
        setSelectedPost(post);
        setActiveView('detail');
        setPostSummary('');
        const { data } = await supabase
            .from('comments')
            .select('*')
            .eq('blog_id', post.id)
            .order('created_at', { ascending: true });
        setComments(data || []);
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment || !selectedPost) return;
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                blog_id: selectedPost.id,
                user_id: user.id,
                comment_text: newComment,
                original_language: locale || 'en'
            }])
            .select();
        if (!error && data) {
            setComments([...comments, data[0]]);
            setNewComment('');
        }
    };

    const handleSummarize = async () => {
        if (!selectedPost) return;
        setSummarizing(true);
        const summary = await generateSummary(selectedPost.content, locale);
        setPostSummary(summary);
        setSummarizing(false);
    };

    const handleAI = async (type) => {
        setAiLoading(prev => ({ ...prev, [type]: true }));
        try {

            // Use the topic (title) or first part of content as context
            const topic = title || content.slice(0, 200);

            if (type === 'improve') {
                const improved = await improveWriting(content, baseLang);
                if (improved) setContent(improved);
            } else {
                const result = await generateAllBlogContent(topic, baseLang);
                if (result) {
                    setAiResults(prev => ({
                        ...prev,
                        title: result.title,
                        seo: result.description,
                        hashtags: (result.hashtags || []).join(' '),
                        summary: result.summary
                    }));
                    if (type === 'title') setTitle(result.title);
                }
            }
        } catch (err) {
            console.error(`AI ${type} failed:`, err);
        }
        setAiLoading(prev => ({ ...prev, [type]: false }));
    };

    const handleFileUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        setPublishing(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('blog-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('blog-attachments')
                .getPublicUrl(filePath);

            setAttachments(prev => [...prev, { type, url: publicUrl, name: file.name }]);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file: ' + error.message);
        } finally {
            setPublishing(false);
        }
    };


    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-black font-sans flex text-slate-800">
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-[280px] min-h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-40 shadow-xl"
                    >
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <BookOpen className="text-white" size={18} />
                                </div>
                                <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Blogy</span>
                            </div>
                        </div>

                        <div className="p-4 border-b border-slate-100">
                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate text-black">{user?.email}</p>
                                    <p className="text-xs text-black/40 font-bold uppercase tracking-wider">Writer</p>
                                </div>
                            </div>
                        </div>

                        <nav className="flex-1 p-4 space-y-1">
                            <SidebarItem
                                icon={<Plus size={18} />}
                                label={t("nav.createPost")}
                                active={activeView === 'create'}
                                onClick={() => setActiveView('create')}
                            />
                            <SidebarItem
                                icon={<FileText size={18} />}
                                label={t("nav.myPosts")}
                                active={activeView === 'myposts'}
                                onClick={() => { setActiveView('myposts'); setIsEditing(false); fetchPosts(); }}
                            />
                            <SidebarItem
                                icon={<List size={18} />}
                                label={t("nav.allPosts")}
                                active={activeView === 'posts'}
                                onClick={() => { setActiveView('posts'); setIsEditing(false); fetchPosts(); }}
                            />
                        </nav>

                        <div className="p-4 border-t border-slate-100 space-y-3">
                            <LanguageSelector
                                currentLocale={locale}
                                onChange={(val) => setLingoLocale(val)}
                                position="top"
                                className="w-full"
                            />
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-3 text-black/50 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-bold"
                            >
                                <LogOut size={18} />
                                {t("nav.logout")}
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-slate-50 text-black/50 rounded-xl transition-all"
                            >
                                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                            </button>
                            <h2 className="text-xl font-bold text-black">{t("dashboard.title")}</h2>
                        </div>
                        <div className="text-sm text-black/40 font-bold uppercase tracking-tight">
                            {t("dashboard.welcome")}, <span className="text-indigo-600">{user?.email?.split('@')[0]}</span>
                        </div>
                    </div>
                </header>

                <main className="p-6 pb-32">
                    {activeView === 'create' && (
                        <CreatePostView
                            title={title}
                            setTitle={setTitle}
                            content={content}
                            setContent={setContent}
                            baseLang={baseLang}
                            setBaseLang={setBaseLang}
                            publishing={publishing}
                            handlePublish={handlePublish}
                            aiLoading={aiLoading}
                            aiResults={aiResults}
                            handleAI={handleAI}
                            attachments={attachments}
                            setAttachments={setAttachments}
                            handleFileUpload={handleFileUpload}
                            showLinkInput={showLinkInput}
                            setShowLinkInput={setShowLinkInput}
                            linkUrl={linkUrl}
                            setLinkUrl={setLinkUrl}
                            isEditing={isEditing}
                            onCancel={() => {
                                setIsEditing(false);
                                setEditingPostId(null);
                                setTitle('');
                                setContent('');
                                setAttachments([]);
                                setActiveView('posts');
                            }}
                            t={t}
                            editor={editor}
                        />
                    )}

                    {(activeView === 'posts' || activeView === 'myposts') && (
                        <PostListView
                            posts={activeView === 'myposts' ? posts.filter(p => p.user_id === user?.id) : posts}
                            loading={loadingPosts}
                            onSelect={selectPost}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSpeech={handleSpeech}
                            speakingPostId={speakingPostId}
                            showActions={activeView === 'myposts'}
                            t={t}
                            locale={locale}
                        />
                    )}

                    {activeView === 'detail' && selectedPost && (
                        <PostDetailView
                            post={selectedPost}
                            comments={comments}
                            newComment={newComment} setNewComment={setNewComment}
                            handleComment={handleComment}
                            postSummary={postSummary}
                            summarizing={summarizing}
                            handleSummarize={handleSummarize}
                            attachmentSummaries={attachmentSummaries}
                            setAttachmentSummaries={setAttachmentSummaries}
                            summarizingAttachment={summarizingAttachment}
                            handleAttachmentSummary={handleAttachmentSummary}
                            handleReadDocument={handleReadDocument}
                            readerOpen={readerOpen}
                            setReaderOpen={setReaderOpen}
                            readingContent={readingContent}
                            readingTitle={readingTitle}
                            loadingReader={loadingReader}
                            locale={locale}
                            t={t}
                            onBack={() => setActiveView('posts')}
                        />
                    )}
                </main>
            </div>

            {/* Reader Modal */}
            <AnimatePresence>
                {readerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            onClick={() => setReaderOpen(false)}
                            className="absolute inset-0 bg-black/60 shadow-2xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-black tracking-tight">{readingTitle}</h3>
                                        <p className="text-[10px] text-black/30 uppercase font-black tracking-[0.2em]">Interactive Reader Mode</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReaderOpen(false)}
                                    className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-black/20 hover:text-red-500 rounded-2xl transition-all border border-slate-100"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                {loadingReader ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                                        <div className="relative">
                                            <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <Sparkles className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-black mb-2">Extracting Content...</p>
                                            <p className="text-sm text-black/40 font-bold uppercase tracking-wider">AI is preparing the document for reading</p>
                                        </div>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="prose prose-slate max-w-none"
                                    >
                                        <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl mb-8">
                                            <p className="text-lg leading-[1.8] text-black/70 whitespace-pre-wrap font-serif">
                                                {readingContent}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-[#475569] text-xs font-bold uppercase tracking-widest pt-8 border-t border-white/5">
                                            <Check size={14} /> End of Document
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <Grammy
                mode={activeView === 'create' ? 'writer' : 'viewer'}
                baseLang={baseLang}
                onReplace={(newText) => {
                    if (editor) {
                        editor.commands.insertContent(newText);
                    }
                }}
            />
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                : 'text-black/50 hover:text-black hover:bg-slate-50'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function CreatePostView({
    title, setTitle, content, setContent,
    baseLang, setBaseLang, publishing, handlePublish,
    aiLoading, aiResults, handleAI,
    attachments, setAttachments, handleFileUpload,
    showLinkInput, setShowLinkInput, linkUrl, setLinkUrl,
    isEditing, onCancel,
    t, editor
}) {
    const addLink = () => {
        if (linkUrl) {
            setAttachments(prev => [...prev, { type: 'link', url: linkUrl, name: linkUrl }]);
            setLinkUrl('');
            setShowLinkInput(false);
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                    <PenTool size={24} className="text-indigo-400" />
                    {isEditing ? "Edit Post" : t("nav.createPost")}
                </h3>
                <div className="flex items-center gap-3">
                    {isEditing && (
                        <button
                            onClick={onCancel}
                            className="text-black/40 hover:text-black px-4 py-2 text-sm font-bold transition-colors"
                        >
                            {t("ui.cancel") || "Cancel"}
                        </button>
                    )}
                    <select
                        value={baseLang}
                        onChange={(e) => setBaseLang(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.code} value={l.code}>{l.nativeName}</option>
                        ))}
                    </select>
                    <button
                        onClick={handlePublish}
                        disabled={publishing || !title || !content}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold transition-all"
                    >
                        <Send size={16} />
                        {publishing ? t("editor.publishing") : (isEditing ? (t("editor.update") || "Update") : t("editor.publish"))}
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="relative">
                    <Type className="absolute left-4 top-4 text-black/20" size={20} />
                    <input
                        type="text"
                        placeholder={t("editor.titlePlaceholder")}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder-black/20 text-black"
                    />
                </div>
                <div className="relative min-h-[250px]">
                    <AlignLeft className="absolute left-4 top-4 text-black/20" size={20} />
                    <EditorContent
                        editor={editor}
                        className="prose prose-slate max-w-none w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-lg leading-relaxed outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder-black/20 text-black"
                    />
                </div>

                {/* Attachments Display */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                        {attachments.map((attach, index) => (
                            <div key={index} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 group relative overflow-hidden">
                                {attach.type === 'photo' && <Image size={16} className="text-pink-600" />}
                                {attach.type === 'video' && <Video size={16} className="text-purple-600" />}
                                {attach.type === 'link' && <Link size={16} className="text-blue-600" />}
                                {attach.type === 'document' && <FileText size={16} className="text-emerald-600" />}
                                <span className="text-xs font-bold text-black/60 truncate max-w-[150px]">{attach.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="text-black/20 hover:text-red-600 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center gap-2 pt-2">
                    <label className="p-2.5 hover:bg-slate-100 rounded-xl cursor-pointer transition-all text-black/20 hover:text-black group relative">
                        <Image size={20} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">Photo</span>
                    </label>
                    <label className="p-2.5 hover:bg-slate-100 rounded-xl cursor-pointer transition-all text-black/20 hover:text-black group relative">
                        <Video size={20} />
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">Video</span>
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowLinkInput(!showLinkInput)}
                            className={`p-2.5 hover:bg-slate-100 rounded-xl transition-all text-black/20 hover:text-black group relative ${showLinkInput ? 'bg-slate-100 text-black' : ''}`}
                        >
                            <Link size={20} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">Link</span>
                        </button>
                        {showLinkInput && (
                            <div className="absolute bottom-full mb-4 left-0 bg-white border border-slate-200 p-3 rounded-xl shadow-2xl flex gap-2 min-w-[300px] z-50">
                                <input
                                    type="url"
                                    placeholder="Paste link here..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-600 text-black"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={addLink}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>
                    <label className="p-2.5 hover:bg-slate-100 rounded-xl cursor-pointer transition-all text-black/20 hover:text-black group relative">
                        <FileText size={20} />
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">Document</span>
                    </label>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Sparkles size={22} className="text-indigo-400" />
                    <h4 className="text-lg font-bold">{t("ai.assistant")}</h4>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <AIButton
                        icon={<Type size={16} />}
                        label={t("ai.generateTitle")}
                        loading={aiLoading.title}
                        onClick={() => handleAI('title')}
                        disabled={!content}
                    />
                    <AIButton
                        icon={<Globe size={16} />}
                        label={t("ai.generateSEO")}
                        loading={aiLoading.seo}
                        onClick={() => handleAI('seo')}
                        disabled={!content}
                    />
                    <AIButton
                        icon={<Hash size={16} />}
                        label={t("ai.generateHashtags")}
                        loading={aiLoading.hashtags}
                        onClick={() => handleAI('hashtags')}
                        disabled={!content}
                    />
                    <AIButton
                        icon={<FileText size={16} />}
                        label={t("ai.generateSummary")}
                        loading={aiLoading.summary}
                        onClick={() => handleAI('summary')}
                        disabled={!content}
                    />
                </div>

                <button
                    onClick={() => handleAI('improve')}
                    disabled={aiLoading.improve || !content}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 px-4 py-3 rounded-xl font-bold transition-all border border-indigo-100"
                >
                    {aiLoading.improve ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    {t("ai.improveWriting")}
                </button>

                {(aiResults.seo || aiResults.hashtags || aiResults.summary || aiResults.fileSummary) && (
                    <div className="space-y-3">
                        {aiResults.seo && (
                            <ResultCard label="SEO Description" content={aiResults.seo} />
                        )}
                        {aiResults.hashtags && (
                            <ResultCard label="Hashtags" content={aiResults.hashtags} />
                        )}
                        {aiResults.summary && (
                            <ResultCard label="Summary" content={aiResults.summary} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function AIButton({ icon, label, loading, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-black/60 px-4 py-3 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-indigo-600 hover:text-indigo-600"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
            {label}
        </button>
    );
}

function ResultCard({ label, content }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">{label}</p>
            <p className="text-black/70 text-sm leading-relaxed font-medium">{content}</p>
        </div>
    );
}

function PostListView({ posts, loading, onSelect, onEdit, onDelete, onSpeech, speakingPostId, showActions, t, locale }) {
    const [translatedPosts, setTranslatedPosts] = useState([]);
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
        const translateAll = async () => {
            if (!posts.length) { setTranslatedPosts([]); return; }
            setTranslating(true);
            const results = await Promise.all(
                posts.map(async (post) => {
                    if (post.base_lang === locale) return post;
                    try {
                        const translatedTitle = await translateContent(post.title, post.base_lang, locale);
                        const translatedContent = await translateContent(post.content, post.base_lang, locale);
                        return { ...post, title: translatedTitle, content: translatedContent };
                    } catch {
                        return post;
                    }
                })
            );
            setTranslatedPosts(results);
            setTranslating(false);
        };
        translateAll();
    }, [posts, locale]);

    const displayPosts = translatedPosts.length > 0 ? translatedPosts : posts;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <p className="text-black/30 font-bold uppercase tracking-widest text-xs animate-pulse">{t("ui.loading")}</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <p className="text-xl text-black/20 font-bold uppercase tracking-widest">{t("ui.empty")}</p>
            </div>
        );
    }

    return (
        <div>
            {translating && (
                <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium mb-4 animate-pulse">
                    <Globe size={14} /> Translating posts...
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayPosts.map(post => (
                    <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-white p-6 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 border border-slate-200 hover:border-indigo-600 shadow-sm flex flex-col h-full overflow-visible"
                        onClick={() => onSelect(post)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-300 via-blue-300 to-teal-300 opacity-0 group-hover:opacity-100 transition-opacity blur-[80px] -z-10 rounded-2xl"></div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                                        {post.base_lang}
                                    </span>
                                    {post.base_lang !== locale && (
                                        <span className="text-indigo-600/40 text-[10px] font-black uppercase tracking-tighter">→ {locale}</span>
                                    )}
                                </div>
                                <span className="text-black/30 text-[10px] font-bold">
                                    {new Date(post.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-black mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 text-black">
                                {post.title}
                            </h3>
                            <p className="text-black/50 text-sm line-clamp-3 leading-relaxed font-medium">
                                {post.content}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1">
                                <IconButton
                                    icon={speakingPostId === post.id ? <Square size={14} fill="currentColor" /> : <Volume2 size={16} />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSpeech(post);
                                    }}
                                    active={speakingPostId === post.id}
                                    color="indigo"
                                    title="Listen"
                                />
                            </div>
                            {showActions && (
                                <div className="flex items-center gap-1">
                                    <IconButton
                                        icon={<Edit2 size={16} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(post);
                                        }}
                                        color="blue"
                                        title="Edit"
                                    />
                                    <IconButton
                                        icon={<Trash2 size={16} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(post.id);
                                        }}
                                        color="red"
                                        title="Delete"
                                    />
                                </div>
                            )}
                        </div>
                    </motion.article>
                ))}
            </div>
        </div>
    );
}

function IconButton({ icon, onClick, active, color = 'indigo', title }) {
    const colors = {
        indigo: 'text-indigo-600 hover:bg-indigo-50',
        red: 'text-red-500 hover:bg-red-50',
        blue: 'text-blue-500 hover:bg-blue-50',
    };

    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : colors[color]}`}
        >
            {icon}
        </button>
    );
}

function PostDetailView({ post, comments, newComment, setNewComment, handleComment, postSummary, summarizing, handleSummarize, attachmentSummaries, setAttachmentSummaries, summarizingAttachment, handleAttachmentSummary, handleReadDocument, locale, t, onBack }) {
    const [translatedPost, setTranslatedPost] = useState(post);
    const [postTranslating, setPostTranslating] = useState(false);

    useEffect(() => {
        const translatePost = async () => {
            if (post.base_lang === locale) {
                setTranslatedPost(post);
                return;
            }
            setPostTranslating(true);
            try {
                const translatedTitle = await translateContent(post.title, post.base_lang, locale);
                const translatedContent = await translateContent(post.content, post.base_lang, locale);
                setTranslatedPost({ ...post, title: translatedTitle, content: translatedContent });
            } catch {
                setTranslatedPost(post);
            }
            setPostTranslating(false);
        };
        translatePost();
    }, [post, locale]);

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <button onClick={onBack} className="flex items-center gap-2 text-black/40 hover:text-black transition-colors font-bold uppercase tracking-widest text-xs">
                <ChevronLeft size={18} />
                <span>{t("editor.back")}</span>
            </button>

            <article>
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {post.base_lang} → {locale}
                    </span>
                    {postTranslating && (
                        <span className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                            <Globe size={14} /> Translating...
                        </span>
                    )}
                    <span className="text-black/30 text-xs font-bold uppercase tracking-tighter">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-6 text-black tracking-tight">{translatedPost.title}</h2>
                <div className="prose prose-slate max-w-none">
                    <div className="text-lg text-black/80 leading-[1.8] whitespace-pre-wrap mb-10 font-medium bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        {translatedPost.content}
                    </div>
                </div>

                {/* Attachments Section */}
                {post.metadata?.attachments?.length > 0 && (
                    <div className="mb-10 space-y-4">
                        <h4 className="text-[10px] font-black flex items-center gap-2 text-black/40 uppercase tracking-[0.2em]">
                            <Paperclip size={14} className="text-indigo-600" />
                            Attachments & Media
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {post.metadata.attachments.map((attach, index) => {
                                const ytId = attach.type === 'link' ? (() => {
                                    try {
                                        const u = new URL(attach.url);
                                        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
                                        if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
                                    } catch { return null; }
                                    return null;
                                })() : null;

                                const isDocLink = attach.type === 'link' && (attach.url.toLowerCase().endsWith('.pdf') || attach.url.toLowerCase().endsWith('.docx'));

                                return (
                                    <div key={index} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-indigo-600 transition-all shadow-md group">
                                        {/* Photo */}
                                        {attach.type === 'photo' && (
                                            <div className="w-full bg-[#0f172a] flex items-center justify-center">
                                                <img
                                                    src={attach.url}
                                                    alt={attach.name}
                                                    className="w-full max-h-[500px] object-contain"
                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                                <div style={{ display: 'none' }} className="p-6 flex items-center gap-3 text-[#64748b]">
                                                    <Image size={20} />
                                                    <span className="text-sm">{attach.name}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Native Video */}
                                        {attach.type === 'video' && (
                                            <div className="w-full aspect-video bg-black">
                                                <video controls className="w-full h-full">
                                                    <source src={attach.url} />
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        )}

                                        {/* YouTube Embed */}
                                        {ytId && (
                                            <div className="w-full aspect-video">
                                                <iframe
                                                    className="w-full h-full"
                                                    src={`https://www.youtube.com/embed/${ytId}`}
                                                    title="YouTube video player"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}

                                        {/* Caption / Actions bar */}
                                        <div
                                            className={`p-4 flex items-center justify-between gap-3 ${(attach.type === 'document' || isDocLink) ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
                                            onClick={() => (attach.type === 'document' || isDocLink) && handleReadDocument(attach)}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 ${(attach.type === 'document' || isDocLink) ? 'text-emerald-600' : 'text-indigo-600'
                                                    }`}>
                                                    {attach.type === 'photo' && <Image size={14} />}
                                                    {attach.type === 'video' && <Video size={14} />}
                                                    {(attach.type === 'link' && !isDocLink) && <Link size={14} />}
                                                    {(attach.type === 'document' || isDocLink) && <FileText size={14} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-xs truncate text-black">{attach.name}</p>
                                                    <p className="text-[8px] text-black/30 uppercase font-black tracking-widest">
                                                        {(isDocLink) ? 'document link' : attach.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {(attach.type === 'document' || isDocLink) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReadDocument(attach);
                                                        }}
                                                        className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all border border-indigo-500/10"
                                                        title="Read Document"
                                                    >
                                                        <BookOpen size={14} />
                                                    </button>
                                                )}
                                                <a href={attach.url} target="_blank" rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-black/20 hover:text-black transition-colors flex-shrink-0"
                                                >
                                                    <Globe size={14} />
                                                </a>
                                            </div>
                                        </div>

                                        {/* Generic Link card (non-YouTube) */}
                                        {attach.type === 'link' && !ytId && (
                                            <div className="px-3 pb-3">
                                                <div
                                                    onClick={() => isDocLink && handleReadDocument(attach)}
                                                    className={`block bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all ${isDocLink ? 'cursor-pointer hover:border-emerald-600' : 'cursor-default transition-none'
                                                        }`}
                                                >
                                                    <p className={`text-[11px] font-bold truncate ${isDocLink ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                                        {attach.url}
                                                    </p>
                                                    {isDocLink && (
                                                        <span className="text-[8px] text-emerald-600/50 uppercase font-black mt-1 block tracking-widest">Click to read content</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Document inline PDF */}
                                        {attach.type === 'document' && attach.url.toLowerCase().endsWith('.pdf') && (
                                            <div className="mx-3 mb-3 border border-[#334155] rounded-xl overflow-hidden" style={{ height: '400px' }}>
                                                <iframe src={`${attach.url}#toolbar=0`} className="w-full h-full" title="PDF Document"></iframe>
                                            </div>
                                        )}

                                        {/* AI Summary */}
                                        {(attach.type === 'document' || attach.type === 'link') && (
                                            <div className="px-3 pb-3">
                                                {attachmentSummaries[attach.url] ? (
                                                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">AI Summary</span>
                                                            <button
                                                                onClick={() => setAttachmentSummaries(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[attach.url];
                                                                    return next;
                                                                })}
                                                                className="text-black/20 hover:text-black transition-colors"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-indigo-900 italic leading-snug font-medium">
                                                            "{attachmentSummaries[attach.url]}"
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAttachmentSummary(attach)}
                                                        disabled={summarizingAttachment[attach.url]}
                                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600/5 hover:bg-indigo-600/10 text-indigo-600 rounded-lg text-[10px] font-bold transition-all border border-indigo-100"
                                                    >
                                                        {summarizingAttachment[attach.url] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                        {summarizingAttachment[attach.url] ? 'Summarizing...' : 'AI Summary'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </article>

            <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="font-black flex items-center gap-3 text-indigo-600 uppercase tracking-widest text-sm">
                        <Sparkles size={20} />
                        Post Summary
                    </h4>
                    <button
                        onClick={handleSummarize}
                        disabled={summarizing}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
                    >
                        {summarizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {summarizing ? 'Summarizing...' : t("ai.generateSummary")}
                    </button>
                </div>
                {postSummary ? (
                    <p className="text-indigo-900 italic leading-relaxed bg-white/50 p-6 rounded-3xl border border-white font-medium">"{postSummary}"</p>
                ) : (
                    <p className="text-indigo-600/40 text-sm italic font-bold">Click summarize to get an AI-powered overview.</p>
                )}
            </div>

            <section>
                <h4 className="text-xl font-black mb-6 flex items-center gap-3 text-black tracking-tight">
                    <MessageSquare size={20} className="text-indigo-600" />
                    Comments <span className="text-black/20 font-light">({comments.length})</span>
                </h4>

                <form onSubmit={handleComment} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 mb-6 shadow-sm">
                    <textarea
                        placeholder="Share your thoughts..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 h-24 outline-none focus:ring-2 focus:ring-indigo-600 resize-none text-sm font-medium placeholder-black/20 text-black transition-all mb-4"
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-black/30 font-black uppercase tracking-widest">Posting in {locale?.toUpperCase()}</span>
                        <button
                            type="submit"
                            disabled={!newComment}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-lg shadow-indigo-100"
                        >
                            <Send size={14} />
                            Comment
                        </button>
                    </div>
                </form>

                <div className="space-y-4">
                    {comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} targetLocale={locale} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function CommentItem({ comment, targetLocale }) {
    const [displayContent, setDisplayContent] = useState(comment.comment_text);
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
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
        translateComment();
    }, [targetLocale, comment.comment_text, comment.original_language]);

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/0 group-hover:bg-indigo-600 transition-all" />
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                        <User size={16} className="text-black/30 group-hover:text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-black">User {comment.user_id?.slice(0, 5)}</p>
                        <p className="text-[10px] text-black/30 font-bold uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <span className="text-[10px] font-black text-black/30 uppercase bg-slate-50 px-3 py-1 rounded-full tracking-widest">{comment.original_language}</span>
            </div>
            {translating ? (
                <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                    <Loader2 size={12} className="animate-spin" /> Translating...
                </div>
            ) : (
                <p className="text-black/70 text-sm leading-relaxed font-medium">{displayContent}</p>
            )}
        </div>
    );
}
