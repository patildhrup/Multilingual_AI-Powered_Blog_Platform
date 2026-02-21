import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import LanguageSelector from '../components/LanguageSelector';

const Home = () => {
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const setLocale = setLingoLocale;
    const t = (key) => {
        // console.log("t called with:", key); 
        return dictionary && dictionary[key] ? dictionary[key] : key;
    };

    return (
        <div className="font-sans text-black bg-[#FAFAF9] min-h-screen">

            {/* Navbar */}
            <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 left-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

                    <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Blogy
                    </h1>

                    <div className="flex items-center space-x-8">
                        <ul className="flex space-x-6 text-sm font-bold text-black/60">
                            <li className="hover:text-indigo-600 cursor-pointer transition-colors">
                                {t("nav.home")}
                            </li>
                            <li className="hover:text-indigo-600 cursor-pointer transition-colors">
                                {t("nav.about")}
                            </li>
                            <li className="hover:text-indigo-600 cursor-pointer transition-colors">
                                {t("nav.contact")}
                            </li>
                        </ul>

                        {/* 🌍 Language Selector */}
                        <LanguageSelector
                            currentLocale={locale}
                            className="w-40"
                        />
                    </div>

                </div>
            </nav>

            {/* Hero Section */}
            <section className="h-screen flex items-center justify-center bg-[#FAFAF9] text-black pt-20 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full -z-0"></div>
                <div className="text-center px-6 relative z-10">
                    <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight text-black">
                        {t("hero.title")}
                    </h2>
                    <p className="text-xl md:text-2xl text-black/50 mb-10 leading-relaxed font-medium max-w-3xl mx-auto">
                        {t("hero.subtitle")}
                    </p>
                    <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95">
                        {t("hero.cta")}
                    </button>
                </div>
            </section>

            {/* About Section */}
            <section className="py-32 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h3 className="text-4xl font-black mb-8 text-black">
                        {t("about.title")}
                    </h3>
                    <p className="text-black/60 text-lg leading-relaxed font-medium">
                        {t("about.text")}
                    </p>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-32 bg-[#FAFAF9]">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h3 className="text-4xl font-black mb-8 text-black">
                        {t("contact.title")}
                    </h3>
                    <p className="text-black/40 mb-12 text-lg font-bold">
                        {t("contact.subtitle")}
                    </p>

                    <div className="flex flex-col md:flex-row gap-6 justify-center max-w-2xl mx-auto">
                        <input
                            type="text"
                            placeholder={t("contact.name")}
                            className="bg-white border border-slate-200 p-4 rounded-xl w-full outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                        />
                        <input
                            type="email"
                            placeholder={t("contact.email")}
                            className="bg-white border border-slate-200 p-4 rounded-xl w-full outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                        />
                    </div>

                    <button className="mt-10 bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                        {t("contact.button")}
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white text-black/40 py-12 border-t border-slate-100">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <p className="text-sm font-bold lowercase tracking-tighter">
                        {t("footer.text")}
                    </p>
                </div>
            </footer>

        </div>
    );
};

export default Home;
