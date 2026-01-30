export const loadDictionary = async (locale = "en") => {
    if (!locale) locale = "en";
    try {
        const dictionary = await import(`../locales/${locale}.json`);
        return dictionary.default;
    } catch (error) {
        console.error(`Could not load dictionary for locale: ${locale}`, error);
        return {};
    }
};

export default { loadDictionary };