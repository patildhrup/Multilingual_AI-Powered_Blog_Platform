import axios from 'axios';
import ogs from 'open-graph-scraper';
import { google } from 'googleapis';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

dotenv.config();

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

/**
 * Downloads a file from a URL and returns a buffer
 */
async function downloadFile(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
}

/**
 * Extracts text from PDF
 */
async function extractFromPdf(buffer) {
    const data = await pdf(buffer);
    return data.text;
}

/**
 * Extracts text from DOCX
 */
async function extractFromDocx(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

/**
 * Extracts info from a generic URL using Open Graph
 */
async function extractFromUrl(url) {
    const options = { url };
    try {
        const { result } = await ogs(options);
        const content = [
            result.ogTitle ? `Title: ${result.ogTitle}` : '',
            result.ogDescription ? `Description: ${result.ogDescription}` : '',
            result.twitterDescription ? `Twitter Description: ${result.twitterDescription}` : '',
            result.ogSiteName ? `Site: ${result.ogSiteName}` : ''
        ].filter(Boolean).join('\n');

        return content || 'Could not extract metadata from URL';
    } catch (error) {
        console.error('OGS Error:', error);
        return 'Failed to scrape URL';
    }
}

/**
 * Extracts info from YouTube Video
 */
async function extractFromYouTube(url) {
    try {
        const videoId = extractYouTubeId(url);
        if (!videoId) return 'Invalid YouTube URL';

        const response = await youtube.videos.list({
            part: 'snippet,contentDetails,statistics',
            id: videoId
        });

        if (response.data.items.length === 0) return 'Video not found';

        const snippet = response.data.items[0].snippet;
        return `YouTube Video: ${snippet.title}\nChannel: ${snippet.channelTitle}\nDescription: ${snippet.description}`;
    } catch (error) {
        console.error('YouTube API Error:', error);
        return 'Failed to extract YouTube info';
    }
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Extracts metadata from images using sharp
 */
async function extractFromImage(buffer) {
    try {
        const metadata = await sharp(buffer).metadata();
        return `Image Metadata:\nFormat: ${metadata.format.toUpperCase()}\nDimensions: ${metadata.width}x${metadata.height}\nColor Space: ${metadata.space}`;
    } catch (error) {
        console.error('Sharp Image Error:', error);
        return 'Failed to extract image metadata';
    }
}

/**
 * Main function to extract content based on type or URL
 */
export async function extractContent(input, fileName = '') {
    try {
        // If it's a URL
        if (input.startsWith('http')) {
            if (input.includes('youtube.com') || input.includes('youtu.be')) {
                return await extractFromYouTube(input);
            }

            // For documents in Supabase Storage or other URLs
            const urlPath = input.split('?')[0].toLowerCase();
            if (fileName.endsWith('.pdf') || urlPath.endsWith('.pdf')) {
                const buffer = await downloadFile(input);
                return await extractFromPdf(buffer);
            }
            if (fileName.endsWith('.docx') || urlPath.endsWith('.docx')) {
                const buffer = await downloadFile(input);
                return await extractFromDocx(buffer);
            }
            if (fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i) || urlPath.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                const buffer = await downloadFile(input);
                return await extractFromImage(buffer);
            }

            // Fallback to link scraping
            return await extractFromUrl(input);
        }

        // If it's a Buffer (direct upload handle)
        if (Buffer.isBuffer(input)) {
            const type = await fileTypeFromBuffer(input);
            if (type) {
                if (type.ext === 'pdf') return await extractFromPdf(input);
                if (type.ext === 'docx') return await extractFromDocx(input);
                if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(type.ext)) return await extractFromImage(input);
            }
            return input.toString('utf-8'); // Default to text
        }

        return input;
    } catch (error) {
        console.error('Extraction Error:', error);
        return `Error extracting content: ${error.message}`;
    }
}
