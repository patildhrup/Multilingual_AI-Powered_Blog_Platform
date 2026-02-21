import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { translateContent } from '../lib/lingo';
import { useState, useEffect } from 'react';
import { useLingo, useLingoLocale } from "lingo.dev/react/client";
import { PenTool, BookOpen, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import LanguageSelector from '../components/LanguageSelector';

export default function BlogLanding() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const { user, signOut } = useAuth();

    const t = (key) => {
        return dictionary && dictionary[key] ? dictionary[key] : key;
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching posts:', error);
        } else {
            console.log("Fetched posts:", data);
            setPosts(data);
            setTranslatedPosts(data); // Initialize with original data
        }
        setLoading(false);
    };

    const handleWriteClick = () => {
        if (!user) {
            setIsAuthModalOpen(true);
        } else {
            navigate('/editor');
        }
    };

    // Translation Logic
    const [translatedPosts, setTranslatedPosts] = useState([]);
    useEffect(() => {
        const translateAllPosts = async () => {
            if (posts.length === 0) return;

            // If target matches source or default, arguably we could skip, 
            // but we need to check per post because each post might have a different base_lang.
            // Actually, we can just map through everything.

            const newTranslatedPosts = await Promise.all(
                posts.map(async (post) => {
                    // Optimization: if lang matches, return original
                    if (post.base_lang === locale) return post;

                    // Otherwise translate title and content
                    // We can batch this if the SDK supports it, but for now we do individual
                    // or we reuse the `translateContent` helper which takes an object.

                    try {
                        // Translate title
                        const translatedTitle = await translateContent(post.title, post.base_lang, locale);
                        // Translate content (preview) - maybe only translate first X characters for performance?
                        // For now, translate whole content to be safe and accurate.
                        const translatedContent = await translateContent(post.content, post.base_lang, locale);

                        return {
                            ...post,
                            title: translatedTitle,
                            content: translatedContent
                        };
                    } catch (err) {
                        console.error("Translation failed for post", post.id, err);
                        return post; // Fallback to original
                    }
                })
            );
            setTranslatedPosts(newTranslatedPosts);
        };

        translateAllPosts();
    }, [posts, locale]);

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-black font-sans">
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Globe className="text-white" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Blogy
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <LanguageSelector
                            currentLocale={locale}
                            className="w-44"
                        />

                        {user ? (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleWriteClick}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                >
                                    <PenTool size={18} />
                                    {t("nav.write")}
                                </button>
                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                    <User size={18} className="text-indigo-600" />
                                    <span className="text-sm font-medium hidden md:block text-slate-700">{user.email}</span>
                                    <button
                                        onClick={signOut}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 px-5 py-2 rounded-lg font-semibold transition-all border border-slate-200 shadow-sm"
                                >
                                    <LogIn size={18} />
                                    Sign In
                                </button>
                                <button
                                    onClick={handleWriteClick}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                >
                                    <PenTool size={18} />
                                    Write
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

            <header className="py-24 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full -z-10"></div>
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight text-slate-900">
                        {t("hero.title")}
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed font-light">
                        {t("hero.subtitle")}
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pb-24">
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-black/30 font-bold animate-pulse uppercase tracking-widest text-xs">{t("ui.loading")}</p>
                        </div>
                    ) : translatedPosts.length > 0 ? (
                        translatedPosts.map(post => (
                            <article
                                key={post.id}
                                className="group relative bg-white p-8 rounded-2xl cursor-pointer transition-all hover:-translate-y-2 border border-slate-200"
                                onClick={() => navigate(`/post/${post.id}`)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 via-blue-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity blur-[100px] -z-10 rounded-2xl"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                            {post.base_lang}
                                        </span>
                                        <span className="text-black/60 text-sm italic font-medium">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 group-hover:text-indigo-700 transition-colors text-slate-900">
                                        {post.title}
                                    </h3>
                                    <p className="text-black/70 line-clamp-3 leading-relaxed mb-6 font-medium">
                                        {post.content}
                                    </p>
                                    <div className="flex items-center gap-2 text-indigo-600 font-semibold group-hover:gap-3 transition-all">
                                        <span>{t("post.readMore")}</span>
                                        <BookOpen size={16} />
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                            <p className="text-xl text-slate-500 mb-6">{t("ui.empty")}</p>
                            <button
                                onClick={() => navigate('/editor')}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-8 py-3 rounded-xl font-bold transition-all"
                            >
                                {t("ui.createFirst")}
                            </button>
                        </div>
                    )}
                </section>
            </main>

            <footer className="bg-white py-12 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-black/50 mb-4 font-medium">{t("footer.text")}</p>
                    <div className="flex justify-center gap-4 text-[10px] font-black tracking-[0.2em] text-black/20 uppercase">
                        <span>POWERED BY LINGO.DEV</span>
                        <span>•</span>
                        <span>SUPABASE</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
