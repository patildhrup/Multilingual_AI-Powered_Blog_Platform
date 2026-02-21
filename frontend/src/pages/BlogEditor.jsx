import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { Send, ArrowLeft, Type, AlignLeft, Languages, Image, Video, Link, FileText, Paperclip, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import Grammy from '../components/Grammy';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export default function BlogEditor() {
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const setLingoLocaleFn = setLingoLocale;
    const { user, authLoading } = useAuth();
    const contentRef = useRef(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [baseLang, setBaseLang] = useState('en');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Write your story...',
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });
    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    const t = (key) => {
        return dictionary && dictionary[key] ? dictionary[key] : key;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('You must be logged in to create a post');
            setLoading(false);
            navigate('/');
            return;
        }

        const { data, error } = await supabase
            .from('posts')
            .insert([
                {
                    title,
                    content,
                    base_lang: baseLang,
                    user_id: user.id,
                    metadata: { attachments }
                }
            ])
            .select();

        if (error) {
            console.error('Error creating post:', error);
            alert('Failed to publish post: ' + error.message);
        } else {
            navigate(`/post/${data[0].id}`);
        }
        setLoading(false);
    };

    const handleFileUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
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
            setLoading(false);
        }
    };

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
        <div className="min-h-screen bg-[#FAFAF9] text-black font-sans">
            <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-black/40 hover:text-black transition-colors font-bold uppercase tracking-widest text-xs"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>{t("editor.back")}</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <LanguageSelector
                            currentLocale={baseLang}
                            onChange={(val) => {
                                setBaseLang(val);
                                setLingoLocaleFn(val);
                            }}
                            className="min-w-[180px]"
                        />

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !title || !content}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Send size={18} />
                            {loading ? t("editor.publishing") : t("editor.publish")}
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <form className="space-y-12">
                    <div className="relative group">
                        <Type className="absolute -left-12 top-4 text-black/20 group-focus-within:text-indigo-600 transition-colors hidden md:block" size={32} />
                        <input
                            type="text"
                            placeholder={t("editor.titlePlaceholder")}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none text-5xl md:text-7xl font-black outline-none placeholder-black/10 focus:placeholder-black/20 transition-all text-black tracking-tight"
                        />
                    </div>

                    <div className="relative group min-h-[40vh]">
                        <AlignLeft className="absolute -left-12 top-2 text-black/20 group-focus-within:text-indigo-600 transition-colors hidden md:block" size={32} />
                        <EditorContent
                            editor={editor}
                            className="prose prose-slate max-w-none text-xl md:text-2xl leading-relaxed outline-none focus:outline-none text-black/70 font-medium"
                        />
                    </div>

                    {/* Attachments Display */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-4 pt-10 border-t border-slate-100">
                            {attachments.map((attach, index) => (
                                <div key={index} className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl border border-slate-200 group relative transition-all hover:border-indigo-600 shadow-md">
                                    {attach.type === 'photo' ? (
                                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                                            <img src={attach.url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 ${attach.type === 'video' ? 'bg-purple-50 text-purple-600' :
                                            attach.type === 'link' ? 'bg-blue-50 text-blue-600' :
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {attach.type === 'video' && <Video size={18} />}
                                            {attach.type === 'link' && <Link size={18} />}
                                            {attach.type === 'document' && <FileText size={18} />}
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0 max-w-[200px]">
                                        <span className="text-xs font-black text-black truncate">{attach.name}</span>
                                        <span className="text-[8px] uppercase font-black text-black/30 tracking-widest">{attach.type}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="p-1.5 bg-slate-50 hover:bg-red-500 hover:text-white text-black/20 rounded-lg transition-all border border-slate-100"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="sticky bottom-24 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-2 flex items-center gap-2 max-w-fit mx-auto shadow-2xl">
                        <label className="p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all text-black/30 hover:text-indigo-600 group relative">
                            <Image size={24} />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Photo</span>
                        </label>
                        <label className="p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all text-black/30 hover:text-indigo-600 group relative">
                            <Video size={24} />
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Video</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowLinkInput(!showLinkInput)}
                                className={`p-3 hover:bg-slate-50 rounded-2xl transition-all text-black/30 hover:text-indigo-600 group relative ${showLinkInput ? 'bg-indigo-50 text-indigo-600' : ''}`}
                            >
                                <Link size={24} />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Link</span>
                            </button>
                            {showLinkInput && (
                                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-white border border-slate-200 p-4 rounded-3xl shadow-2xl flex gap-2 min-w-[320px]">
                                    <input
                                        type="url"
                                        placeholder="Paste link here..."
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-600 text-black transition-all"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={addLink}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>
                        <label className="p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all text-black/30 hover:text-indigo-600 group relative">
                            <FileText size={24} />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Document</span>
                        </label>
                    </div>
                </form>

            </main>

            <div className="fixed bottom-8 right-8 text-black/10 text-[10px] font-black uppercase tracking-[0.3em] select-none pointer-events-none">
                Draft saved locally • {baseLang.toUpperCase()} MODE
            </div>
        </div>
    );
}
