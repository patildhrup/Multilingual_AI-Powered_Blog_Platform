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
import { motion, AnimatePresence } from 'framer-motion';

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
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans flex">
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-[280px] min-h-screen bg-[#0a0f1e] border-r border-[#1e293b] flex flex-col fixed left-0 top-0 z-40"
                    >
                        <div className="p-6 border-b border-[#1e293b]">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <BookOpen className="text-white" size={18} />
                                </div>
                                <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Blogy</span>
                            </div>
                        </div>

                        <div className="p-4 border-b border-[#1e293b]">
                            <div className="flex items-center gap-3 bg-[#1e293b]/50 rounded-xl p-3">
                                <div className="w-9 h-9 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{user?.email}</p>
                                    <p className="text-xs text-[#64748b]">Writer</p>
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

                        <div className="p-4 border-t border-[#1e293b] space-y-3">
                            <div className="flex items-center gap-2 bg-[#1e293b]/50 rounded-xl p-2">
                                <Globe size={16} className="text-indigo-400 ml-2" />
                                <select
                                    value={locale || 'en'}
                                    onChange={(e) => setLingoLocale(e.target.value)}
                                    className="flex-1 bg-transparent text-sm font-medium outline-none cursor-pointer"
                                >
                                    {LANGUAGES.map(l => (
                                        <option key={l.code} value={l.code}>{l.nativeName} ({l.code.toUpperCase()})</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-sm font-medium"
                            >
                                <LogOut size={18} />
                                {t("nav.logout")}
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
                <header className="sticky top-0 z-30 bg-[#0f172a]/80 backdrop-blur-xl border-b border-[#1e293b]">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-[#1e293b] rounded-xl transition-all"
                            >
                                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                            </button>
                            <h2 className="text-xl font-bold">{t("dashboard.title")}</h2>
                        </div>
                        <div className="text-sm text-[#64748b]">
                            {t("dashboard.welcome")}, <span className="text-indigo-400 font-semibold">{user?.email?.split('@')[0]}</span>
                        </div>
                    </div>
                </header>

                <main className="p-6 pb-32">
                    {activeView === 'create' && (
                        <CreatePostView
                            title={title} setTitle={setTitle}
                            content={content} setContent={setContent}
                            baseLang={baseLang} setBaseLang={setBaseLang}
                            publishing={publishing} handlePublish={handlePublish}
                            aiLoading={aiLoading} aiResults={aiResults}
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
                                setActiveView('myposts');
                            }}
                            t={t}
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
                            locale={locale}
                            t={t}
                            onBack={() => setActiveView('posts')}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50'
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
    t
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
                            className="text-[#94a3b8] hover:text-white px-4 py-2 text-sm font-bold"
                        >
                            {t("ui.cancel") || "Cancel"}
                        </button>
                    )}
                    <select
                        value={baseLang}
                        onChange={(e) => setBaseLang(e.target.value)}
                        className="bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
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

            <div className="bg-[#1e293b]/50 border border-[#334155] rounded-2xl p-8 space-y-6">
                <div className="relative">
                    <Type className="absolute left-4 top-4 text-[#334155]" size={20} />
                    <input
                        type="text"
                        placeholder={t("editor.titlePlaceholder")}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-[#334155]"
                    />
                </div>
                <div className="relative">
                    <AlignLeft className="absolute left-4 top-4 text-[#334155]" size={20} />
                    <textarea
                        placeholder={t("editor.contentPlaceholder")}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl py-4 pl-12 pr-4 text-lg leading-relaxed outline-none min-h-[250px] resize-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-[#334155]"
                    />
                </div>

                {/* Attachments Display */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-[#334155]">
                        {attachments.map((attach, index) => (
                            <div key={index} className="flex items-center gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-[#334155] group relative overflow-hidden">
                                {attach.type === 'photo' && <Image size={16} className="text-pink-400" />}
                                {attach.type === 'video' && <Video size={16} className="text-purple-400" />}
                                {attach.type === 'link' && <Link size={16} className="text-blue-400" />}
                                {attach.type === 'document' && <FileText size={16} className="text-emerald-400" />}
                                <span className="text-xs font-medium truncate max-w-[150px]">{attach.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="text-[#64748b] hover:text-red-400 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center gap-2 pt-2">
                    <label className="p-2.5 hover:bg-[#0f172a] rounded-xl cursor-pointer transition-all text-[#64748b] hover:text-white group relative">
                        <Image size={20} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#334155] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Photo</span>
                    </label>
                    <label className="p-2.5 hover:bg-[#0f172a] rounded-xl cursor-pointer transition-all text-[#64748b] hover:text-white group relative">
                        <Video size={20} />
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#334155] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Video</span>
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowLinkInput(!showLinkInput)}
                            className={`p-2.5 hover:bg-[#0f172a] rounded-xl transition-all text-[#64748b] hover:text-white group relative ${showLinkInput ? 'bg-[#0f172a] text-white' : ''}`}
                        >
                            <Link size={20} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#334155] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Link</span>
                        </button>
                        {showLinkInput && (
                            <div className="absolute bottom-full mb-4 left-0 bg-[#0a0f1e] border border-[#334155] p-3 rounded-xl shadow-2xl flex gap-2 min-w-[300px] z-50">
                                <input
                                    type="url"
                                    placeholder="Paste link here..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
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
                    <label className="p-2.5 hover:bg-[#0f172a] rounded-xl cursor-pointer transition-all text-[#64748b] hover:text-white group relative">
                        <FileText size={20} />
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#334155] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Document</span>
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
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 disabled:opacity-50 text-indigo-300 px-4 py-3 rounded-xl font-semibold transition-all border border-indigo-500/20"
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
            className="flex items-center justify-center gap-2 bg-[#0f172a]/50 hover:bg-[#0f172a] disabled:opacity-50 text-[#e2e8f0] px-4 py-3 rounded-xl text-sm font-semibold transition-all border border-[#334155] hover:border-indigo-500/30"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
            {label}
        </button>
    );
}

function ResultCard({ label, content }) {
    return (
        <div className="bg-[#0f172a]/50 border border-[#334155] rounded-xl p-4">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-[#e2e8f0] text-sm leading-relaxed">{content}</p>
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
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <p className="text-[#94a3b8] animate-pulse">{t("ui.loading")}</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-20 bg-[#1e293b]/50 rounded-3xl border border-dashed border-[#334155]">
                <p className="text-xl text-[#94a3b8] mb-4">{t("ui.empty")}</p>
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
                        className="group bg-[#1e293b] p-6 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 border border-[#334155] hover:border-indigo-500/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex flex-col h-full"
                        onClick={() => onSelect(post)}
                    >
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                        {post.base_lang}
                                    </span>
                                    {post.base_lang !== locale && (
                                        <span className="text-indigo-400/60 text-[10px] font-bold uppercase">→ {locale}</span>
                                    )}
                                </div>
                                <span className="text-[#64748b] text-[10px]">
                                    {new Date(post.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="text-[#94a3b8] text-sm line-clamp-3 leading-relaxed">
                                {post.content}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-[#334155] pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
        indigo: 'text-indigo-400 hover:bg-indigo-500/10',
        red: 'text-red-400 hover:bg-red-500/10',
        blue: 'text-blue-400 hover:bg-blue-500/10',
    };

    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-all ${active ? 'bg-indigo-500/20 text-indigo-400' : colors[color]}`}
        >
            {icon}
        </button>
    );
}

function PostDetailView({ post, comments, newComment, setNewComment, handleComment, postSummary, summarizing, handleSummarize, attachmentSummaries, setAttachmentSummaries, summarizingAttachment, handleAttachmentSummary, locale, t, onBack }) {
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
            <button onClick={onBack} className="flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors">
                <ChevronLeft size={18} />
                <span className="text-sm font-medium">{t("editor.back")}</span>
            </button>

            <article>
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-indigo-500/10 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full uppercase">
                        {post.base_lang} → {locale}
                    </span>
                    {postTranslating && (
                        <span className="flex items-center gap-2 text-indigo-400 text-sm animate-pulse">
                            <Globe size={14} /> Translating...
                        </span>
                    )}
                    <span className="text-[#64748b] text-sm">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-6">{translatedPost.title}</h2>
                <p className="text-lg text-[#cbd5e1] leading-relaxed whitespace-pre-wrap mb-10">{translatedPost.content}</p>

                {/* Attachments Section */}
                {post.metadata?.attachments?.length > 0 && (
                    <div className="mb-10 space-y-4">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-[#64748b] uppercase tracking-widest">
                            <Paperclip size={14} className="text-indigo-400" />
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

                                return (
                                    <div key={index} className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all shadow-lg">
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
                                        <div className="p-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-7 h-7 bg-[#0f172a] rounded-lg flex items-center justify-center text-indigo-400 flex-shrink-0">
                                                    {attach.type === 'photo' && <Image size={14} />}
                                                    {attach.type === 'video' && <Video size={14} />}
                                                    {(attach.type === 'link') && <Link size={14} />}
                                                    {attach.type === 'document' && <FileText size={14} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-xs truncate">{attach.name}</p>
                                                    <p className="text-[8px] text-[#475569] uppercase font-black">{attach.type}</p>
                                                </div>
                                            </div>
                                            <a href={attach.url} target="_blank" rel="noopener noreferrer" className="text-[#475569] hover:text-white flex-shrink-0">
                                                <Globe size={14} />
                                            </a>
                                        </div>

                                        {/* Generic Link card (non-YouTube) */}
                                        {attach.type === 'link' && !ytId && (
                                            <div className="px-3 pb-3">
                                                <a href={attach.url} target="_blank" rel="noopener noreferrer"
                                                    className="block bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 hover:border-indigo-500/30 transition-all">
                                                    <p className="text-[11px] text-indigo-400 font-bold truncate">{attach.url}</p>
                                                </a>
                                            </div>
                                        )}

                                        {/* Document inline */}
                                        {attach.type === 'document' && attach.url.toLowerCase().endsWith('.pdf') && (
                                            <div className="mx-3 mb-3 border border-[#334155] rounded-xl overflow-hidden" style={{ height: '400px' }}>
                                                <iframe src={`${attach.url}#toolbar=0`} className="w-full h-full" title="PDF Document"></iframe>
                                            </div>
                                        )}

                                        {/* AI Summary */}
                                        {(attach.type === 'document' || attach.type === 'link' || attach.type === 'photo') && (
                                            <div className="px-3 pb-3">
                                                {attachmentSummaries[attach.url] ? (
                                                    <div className="bg-[#0f172a] p-2.5 rounded-lg border border-indigo-500/10">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">AI Summary</span>
                                                            <button
                                                                onClick={() => setAttachmentSummaries(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[attach.url];
                                                                    return next;
                                                                })}
                                                                className="text-[#334155] hover:text-white"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-indigo-100 italic leading-snug">
                                                            {attachmentSummaries[attach.url]}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAttachmentSummary(attach)}
                                                        disabled={summarizingAttachment[attach.url]}
                                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600/5 hover:bg-indigo-600/10 text-indigo-400 rounded-lg text-[10px] font-bold transition-all border border-indigo-500/10"
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

            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-400" />
                        Post Summary
                    </h4>
                    <button
                        onClick={handleSummarize}
                        disabled={summarizing}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                    >
                        {summarizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {summarizing ? 'Summarizing...' : t("ai.generateSummary")}
                    </button>
                </div>
                {postSummary ? (
                    <p className="text-indigo-100 italic leading-relaxed bg-[#0f172a]/50 p-4 rounded-xl">"{postSummary}"</p>
                ) : (
                    <p className="text-[#94a3b8] text-sm italic">Click summarize to get an AI-powered overview.</p>
                )}
            </div>

            <section>
                <h4 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <MessageSquare size={20} className="text-indigo-400" />
                    Comments ({comments.length})
                </h4>

                <form onSubmit={handleComment} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 mb-6">
                    <textarea
                        placeholder="Share your thoughts..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 h-24 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm font-medium placeholder-[#475569] mb-4"
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#64748b]">Posting in {locale?.toUpperCase()}</span>
                        <button
                            type="submit"
                            disabled={!newComment}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
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
        <div className="bg-[#1e293b] p-5 rounded-2xl border border-[#334155]">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center">
                        <User size={14} className="text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">User {comment.user_id?.slice(0, 5)}</p>
                        <p className="text-xs text-[#64748b]">{new Date(comment.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-[#475569] uppercase bg-[#0f172a] px-2 py-1 rounded-full">{comment.original_language}</span>
            </div>
            {translating ? (
                <div className="flex items-center gap-2 text-indigo-400 text-xs italic">
                    <Loader2 size={12} className="animate-spin" /> Translating...
                </div>
            ) : (
                <p className="text-[#e2e8f0] text-sm leading-relaxed">{displayContent}</p>
            )}
        </div>
    );
}
