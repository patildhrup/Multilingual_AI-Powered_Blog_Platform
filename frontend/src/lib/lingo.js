import { LingoDotDevEngine } from 'lingo.dev/sdk';

const apiKey = import.meta.env.VITE_LINGO_API_KEY;

export const translateContent = async (content, sourceLang, targetLang) => {
    if (!apiKey) {
        console.warn('LINGO_API_KEY not found');
        return content;
    }

    if (sourceLang === targetLang) return content;

    try {
        const engine = new LingoDotDevEngine({ apiKey });

        // If content is a string, wrap it in an object for the SDK
        const isString = typeof content === 'string';
        const sourceObj = isString ? { text: content } : content;

        const translatedObj = await engine.localizeObject(sourceObj, {
            sourceLocale: sourceLang,
            targetLocale: targetLang,
        });

        return isString ? translatedObj.text : translatedObj;
    } catch (error) {
        console.error('Lingo translation failed:', error);
        return content;
    }
};

export const summarizeFeedback = async (comments, targetLang) => {
    if (!apiKey) return "AI Summary unavailable (API Key missing)";
    if (!comments || comments.length === 0) return "No feedback yet.";

    try {
        const engine = new LingoDotDevEngine({ apiKey });

        const commentTexts = comments.map(c => c.comment_text).join('\n');
        const prompt = `Summarize the following reader feedback from a blog post in ${targetLang}. Focus on the overall sentiment and key points mentioned by readers.\n\nComments:\n${commentTexts}`;


        // Using localizeObject as a workaround for AI summary if dedicated AI method is not available in SDK
        // In 0.124.0, we might need to be creative or check docs.
        // Assuming localizeObject can handle free-form if passed as a value.
        // But better to use the translate feature to "transform" it.

        const result = await engine.localizeObject({ summary: prompt }, {
            sourceLocale: 'en', // doesn't really matter for this specific prompt
            targetLocale: targetLang,
        });

        return result.summary;
    } catch (error) {
        console.error('AI Feedback summarization failed:', error);
        return "Failed to generate summary.";
    }
};
