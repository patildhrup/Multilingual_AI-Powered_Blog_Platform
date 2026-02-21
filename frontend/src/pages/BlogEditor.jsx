import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { Send, ArrowLeft, Type, AlignLeft, Languages, Image, Video, Link, FileText, Paperclip, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BlogEditor() {
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const setLingoLocaleFn = setLingoLocale;
    const { user, loading: authLoading } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [baseLang, setBaseLang] = useState('en');
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
        <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans">
            <nav className="border-b border-[#1e293b] bg-[#0f172a]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">{t("editor.back")}</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-[#334155]">
                            <Languages size={16} className="text-indigo-400" />
                            <select
                                value={baseLang}
                                onChange={(e) => {
                                    setBaseLang(e.target.value);
                                    setLingoLocaleFn(e.target.value);
                                }}
                                className="bg-transparent text-sm font-semibold outline-none cursor-pointer"
                            >
                                <option value="en">English (US)</option>
                                <option value="hi">Hindi (हिंदी)</option>
                                <option value="ja">Japanese (日本語)</option>
                                <option value="fr">French (Français)</option>
                                <option value="es">Spanish (Español)</option>
                            </select>
                        </div>

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
                        <Type className="absolute -left-12 top-4 text-[#334155] group-focus-within:text-indigo-500 transition-colors hidden md:block" size={32} />
                        <input
                            type="text"
                            placeholder={t("editor.titlePlaceholder")}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none text-5xl md:text-6xl font-black outline-none placeholder-[#1e293b] focus:placeholder-[#334155] transition-all"
                        />
                    </div>

                    <div className="relative group">
                        <AlignLeft className="absolute -left-12 top-2 text-[#334155] group-focus-within:text-indigo-500 transition-colors hidden md:block" size={32} />
                        <textarea
                            placeholder={t("editor.contentPlaceholder")}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-transparent border-none text-xl md:text-2xl leading-relaxed outline-none min-h-[40vh] resize-none placeholder-[#1e293b] focus:placeholder-[#334155] transition-all"
                        />
                    </div>

                    {/* Attachments Display */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-4 pt-10 border-t border-[#1e293b]">
                            {attachments.map((attach, index) => (
                                <div key={index} className="flex items-center gap-3 bg-[#1e293b] p-2 pr-4 rounded-2xl border border-[#334155] group relative transition-all hover:border-indigo-500/50 shadow-lg">
                                    {attach.type === 'photo' ? (
                                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-[#334155]">
                                            <img src={attach.url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#334155] ${attach.type === 'video' ? 'bg-purple-500/10 text-purple-400' :
                                                attach.type === 'link' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                            {attach.type === 'video' && <Video size={20} />}
                                            {attach.type === 'link' && <Link size={20} />}
                                            {attach.type === 'document' && <FileText size={20} />}
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0 max-w-[150px]">
                                        <span className="text-xs font-bold truncate">{attach.name}</span>
                                        <span className="text-[9px] uppercase font-black text-[#475569] tracking-widest">{attach.type}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="p-1.5 bg-[#0f172a] hover:bg-red-500 hover:text-white text-[#94a3b8] rounded-lg transition-all border border-[#334155]"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="sticky bottom-24 bg-[#1e293b]/80 backdrop-blur-lg border border-[#334155] rounded-2xl p-2 flex items-center gap-2 max-w-fit mx-auto shadow-2xl">
                        <label className="p-3 hover:bg-[#334155] rounded-xl cursor-pointer transition-all text-[#94a3b8] hover:text-white group relative">
                            <Image size={24} />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#334155] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Photo</span>
                        </label>
                        <label className="p-3 hover:bg-[#334155] rounded-xl cursor-pointer transition-all text-[#94a3b8] hover:text-white group relative">
                            <Video size={24} />
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#334155] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Video</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowLinkInput(!showLinkInput)}
                                className={`p-3 hover:bg-[#334155] rounded-xl transition-all text-[#94a3b8] hover:text-white group relative ${showLinkInput ? 'bg-[#334155] text-white' : ''}`}
                            >
                                <Link size={24} />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#334155] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Link</span>
                            </button>
                            {showLinkInput && (
                                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-[#334155] p-3 rounded-xl shadow-2xl flex gap-2 min-w-[300px]">
                                    <input
                                        type="url"
                                        placeholder="Paste link here..."
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={addLink}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>
                        <label className="p-3 hover:bg-[#334155] rounded-xl cursor-pointer transition-all text-[#94a3b8] hover:text-white group relative">
                            <FileText size={24} />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#334155] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Document</span>
                        </label>
                    </div>
                </form>
            </main>

            <div className="fixed bottom-8 right-8 text-[#334155] text-xs font-mono select-none uppercase tracking-[0.2em]">
                Draft saved locally • {baseLang.toUpperCase()} MODE
            </div>
        </div>
    );
}
