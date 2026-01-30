import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";

const Home = () => {
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const setLocale = setLingoLocale;
    const t = (key) => {
        // console.log("t called with:", key); 
        return dictionary && dictionary[key] ? dictionary[key] : key;
    };

    return (
        <div className="font-sans text-gray-800">

            {/* Navbar */}
            <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

                    <h1 className="text-xl font-bold text-indigo-600">
                        MyApp
                    </h1>

                    <div className="flex items-center space-x-6">
                        <ul className="flex space-x-6 text-sm font-medium">
                            <li className="hover:text-indigo-600 cursor-pointer">
                                {t("nav.home")}
                            </li>
                            <li className="hover:text-indigo-600 cursor-pointer">
                                {t("nav.about")}
                            </li>
                            <li className="hover:text-indigo-600 cursor-pointer">
                                {t("nav.contact")}
                            </li>
                        </ul>

                        {/* 🌍 Language Selector */}
                        <select
                            value={locale || ""}
                            onChange={(e) => setLocale(e.target.value)}
                            className="border rounded-md px-2 py-1 text-sm focus:outline-none"
                        >
                            <option value="en">EN</option>
                            <option value="hi">HI</option>
                        </select>
                    </div>

                </div>
            </nav>

            {/* Hero Section */}
            <section className="h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white pt-20">
                <div className="text-center px-6">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        {t("hero.title")}
                    </h2>
                    <p className="text-lg mb-6">
                        {t("hero.subtitle")}
                    </p>
                    <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                        {t("hero.cta")}
                    </button>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <h3 className="text-3xl font-bold mb-6">
                        {t("about.title")}
                    </h3>
                    <p className="text-gray-600 max-w-3xl mx-auto">
                        {t("about.text")}
                    </p>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h3 className="text-3xl font-bold mb-6">
                        {t("contact.title")}
                    </h3>
                    <p className="text-gray-600 mb-8">
                        {t("contact.subtitle")}
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <input
                            type="text"
                            placeholder={t("contact.name")}
                            className="border p-3 rounded-md w-full md:w-1/3"
                        />
                        <input
                            type="email"
                            placeholder={t("contact.email")}
                            className="border p-3 rounded-md w-full md:w-1/3"
                        />
                    </div>

                    <button className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                        {t("contact.button")}
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-6">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <p className="text-sm">
                        {t("footer.text")}
                    </p>
                </div>
            </footer>

        </div>
    );
};

export default Home;
