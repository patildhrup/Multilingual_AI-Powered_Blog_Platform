const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const translateContent = async (content, sourceLang, targetLang) => {
    if (!sourceLang || !targetLang || sourceLang === targetLang) return content;

    try {
        // Call local backend server
        const response = await fetch(`${BACKEND_URL}/api/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                sourceLang,
                targetLang
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Translation API error:', error);
            return content; // Fallback to original
        }

        const { translatedContent } = await response.json();
        return translatedContent;
    } catch (error) {
        console.error('Lingo translation failed:', error);
        return content;
    }
};

export const summarizeFeedback = async (comments, targetLang) => {
    if (!comments || comments.length === 0) return "No feedback yet.";

    try {
        const commentTexts = comments.map(c => c.comment_text).join('\n');
        const prompt = `Summarize the following reader feedback from a blog post in ${targetLang}. Focus on the overall sentiment and key points mentioned by readers.\n\nComments:\n${commentTexts}`;

        // Use the same translate function to localize the summary
        const summary = await translateContent(prompt, 'en', targetLang);

        return summary;
    } catch (error) {
        console.error('AI Feedback summarization failed:', error);
        return "Failed to generate summary.";
    }
};
