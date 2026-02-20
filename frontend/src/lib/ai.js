const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const callTranslateAPI = async (content, sourceLang, targetLang) => {
    const response = await fetch(`${BACKEND_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sourceLang, targetLang })
    });
    if (!response.ok) throw new Error('API call failed');
    const { translatedContent } = await response.json();
    return translatedContent;
};

export const generateTitle = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return '';
    try {
        const prompt = `Generate a compelling blog title for the following content. Return ONLY the title, nothing else:\n\n${content.slice(0, 500)}`;
        return await callTranslateAPI(prompt, 'en', lang);
    } catch (error) {
        console.error('Title generation failed:', error);
        return '';
    }
};

export const generateSEODescription = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return '';
    try {
        const prompt = `Write a concise SEO meta description (max 160 characters) for the following blog content. Return ONLY the description:\n\n${content.slice(0, 500)}`;
        return await callTranslateAPI(prompt, 'en', lang);
    } catch (error) {
        console.error('SEO generation failed:', error);
        return '';
    }
};

export const generateHashtags = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return '';
    try {
        const prompt = `Generate 5-8 relevant hashtags for the following blog content. Return ONLY the hashtags separated by spaces:\n\n${content.slice(0, 500)}`;
        return await callTranslateAPI(prompt, 'en', lang);
    } catch (error) {
        console.error('Hashtag generation failed:', error);
        return '';
    }
};

export const generateSummary = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return '';
    try {
        const prompt = `Write a brief 2-3 sentence summary of the following blog content. Return ONLY the summary:\n\n${content.slice(0, 1000)}`;
        return await callTranslateAPI(prompt, 'en', lang);
    } catch (error) {
        console.error('Summary generation failed:', error);
        return '';
    }
};

export const improveWriting = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return content;
    try {
        const prompt = `Improve the following paragraph for clarity, grammar, and engagement. Return ONLY the improved paragraph:\n\n${content}`;
        return await callTranslateAPI(prompt, 'en', lang);
    } catch (error) {
        console.error('Writing improvement failed:', error);
        return content;
    }
};

export const switchTone = async (content, tone, lang = 'en') => {
    if (!content || content.trim().length < 10) return content;
    try {
        const prompt = `Rewrite the following text in a ${tone} tone. Return ONLY the rewritten text:\n\n${content}`;
        return await callTranslateAPI(prompt, 'en', lang);
    } catch (error) {
        console.error('Tone switch failed:', error);
        return content;
    }
};
