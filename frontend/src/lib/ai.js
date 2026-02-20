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

const callGenerateAPI = async (topic, locale) => {
    const response = await fetch(`${BACKEND_URL}/api/generate-blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, locale })
    });
    if (!response.ok) throw new Error('AI Generation failed');
    return await response.json();
};

export const generateAllBlogContent = async (topic, lang = 'en') => {
    if (!topic || topic.trim().length < 5) return null;
    try {
        return await callGenerateAPI(topic, lang);
    } catch (error) {
        console.error('AI Full Generation failed:', error);
        return null;
    }
};

export const generateTitle = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return '';
    try {
        const result = await callGenerateAPI(content, lang);
        return result.title || '';
    } catch (error) {
        console.error('Title generation failed:', error);
        return '';
    }
};

export const generateSEODescription = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return '';
    try {
        const result = await callGenerateAPI(content, lang);
        return result.description || '';
    } catch (error) {
        console.error('SEO generation failed:', error);
        return '';
    }
};

export const generateHashtags = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return '';
    try {
        const result = await callGenerateAPI(content, lang);
        return (result.hashtags || []).join(' ') || '';
    } catch (error) {
        console.error('Hashtag generation failed:', error);
        return '';
    }
};

export const generateSummary = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return '';
    try {
        const result = await callGenerateAPI(content, lang);
        return result.summary || '';
    } catch (error) {
        console.error('Summary generation failed:', error);
        return '';
    }
};

export const improveWriting = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return content;
    try {
        const response = await fetch(`${BACKEND_URL}/api/improve-writing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, locale: lang })
        });
        if (!response.ok) throw new Error('AI Improvement failed');
        const { improvedContent } = await response.json();
        return improvedContent;
    } catch (error) {
        console.error('Writing improvement failed:', error);
        return content;
    }
};

export const switchTone = async (content, tone, lang = 'en') => {
    if (!content || content.trim().length < 10) return content;
    try {
        const prompt = `Rewrite the following text in a ${tone} tone. Keep it in ${lang}.:\n\n${content}`;
        const response = await fetch(`${BACKEND_URL}/api/improve-writing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: prompt, locale: lang })
        });
        if (!response.ok) throw new Error('Tone switch failed');
        const { improvedContent } = await response.json();
        return improvedContent;
    } catch (error) {
        console.error('Tone switch failed:', error);
        return content;
    }
};
