const SUPPORTED_LOCALES = ['en', 'hi', 'ar', 'fr', 'de', 'zh', 'ja'];

export const loadDictionary = async (locale = "en") => {
    if (!locale || !SUPPORTED_LOCALES.includes(locale)) locale = "en";
    try {
        const dictionary = await import(`../locales/${locale}.json`);
        return dictionary.default;
    } catch (error) {
        console.error(`Could not load dictionary for locale: ${locale}`, error);
        const fallback = await import('../locales/en.json');
        return fallback.default;
    }
};

export const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export default { loadDictionary, LANGUAGES };