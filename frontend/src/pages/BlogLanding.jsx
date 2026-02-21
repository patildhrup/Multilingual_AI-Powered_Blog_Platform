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
        <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans">
            <nav className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-[#1e293b]">
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
                                <div className="flex items-center gap-3 bg-[#1e293b] px-4 py-2 rounded-lg border border-[#334155]">
                                    <User size={18} className="text-indigo-400" />
                                    <span className="text-sm font-medium hidden md:block">{user.email}</span>
                                    <button
                                        onClick={signOut}
                                        className="text-[#94a3b8] hover:text-red-400 transition-colors"
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
                                    className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-white px-5 py-2 rounded-lg font-semibold transition-all border border-[#334155]"
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full -z-10"></div>
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
                        {t("hero.title")}
                    </h2>
                    <p className="text-xl md:text-2xl text-[#94a3b8] mb-10 leading-relaxed font-light">
                        {t("hero.subtitle")}
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pb-24">
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[#94a3b8] animate-pulse">{t("ui.loading")}</p>
                        </div>
                    ) : translatedPosts.length > 0 ? (
                        translatedPosts.map(post => (
                            <article
                                key={post.id}
                                className="group bg-[#1e293b] p-8 rounded-2xl cursor-pointer transition-all hover:-translate-y-2 border border-[#334155] hover:border-indigo-500/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                                onClick={() => navigate(`/post/${post.id}`)}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-indigo-500/10 text-indigo-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        {post.base_lang}
                                    </span>
                                    <span className="text-[#64748b] text-sm italic">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-indigo-400 transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-[#94a3b8] line-clamp-3 leading-relaxed mb-6">
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-2 text-indigo-400 font-semibold group-hover:gap-3 transition-all">
                                    <span>{t("post.readMore")}</span>
                                    <BookOpen size={16} />
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-[#1e293b]/50 rounded-3xl border border-dashed border-[#334155]">
                            <p className="text-xl text-[#94a3b8] mb-6">{t("ui.empty")}</p>
                            <button
                                onClick={() => navigate('/editor')}
                                className="bg-[#334155] hover:bg-[#475569] text-white px-8 py-3 rounded-xl font-bold transition-all"
                            >
                                {t("ui.createFirst")}
                            </button>
                        </div>
                    )}
                </section>
            </main>

            <footer className="bg-[#020617] py-12 border-t border-[#1e293b]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-[#64748b] mb-4">{t("footer.text")}</p>
                    <div className="flex justify-center gap-4 text-xs font-medium text-[#475569]">
                        <span>POWERED BY LINGO.DEV</span>
                        <span>•</span>
                        <span>SUPABASE</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
