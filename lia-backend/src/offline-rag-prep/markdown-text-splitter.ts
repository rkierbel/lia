import * as fs from 'node:fs/promises';
import {Chunk} from '../interface/chunk.js';

export class MarkdownTextSplitter {

    constructor() {
    }

    /*
     * Splits a Markdown document into chunks based on # headers
     * @param {string} markdownFilePath - The path to a Markdown document to split
     * @returns {Promise<string[]>} Array of chunks
     */
    public async splitMarkdownByHeaders(markdownFilePath: string): Promise<Chunk[]> {
        const markdown = await fs.readFile(markdownFilePath, {
            encoding: 'utf-8',
            flag: 'r'
        });

        // Split the document into lines
        const lines: string[] = markdown.split('\n').map(l => l.trim()).filter(l => l !== '');
        const chunks: Chunk[] = [];
        let currentChunk: string[] = [];
        let currentId: string = '';

        // Regular expression to match article headers like "#### Art. 4." or "#### Art. 44/4." or "#### Art. 44bis." or "#### Art. 44bis/4."
        const headerRegex = /^#{1,6}\s*Art\.\s*(\d{1,3}(?:\/\d+)*(?:bis|ter|quater|[a-z]*es)?(?:\/\d+)?)\.*/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];


            const headerMatch = line.match(headerRegex);

            if (headerMatch) {
                // Save previous chunk if it exists
                if (currentChunk.length > 0) {
                    chunks.push({
                        content: currentChunk.join(' '),
                        id: currentId
                    });
                    currentChunk = [];
                }
                // Start new chunk with the header and store the article number
                currentId = headerMatch[1];
                currentChunk.push(line.replace('####', '').trim());
            } else {
                currentChunk.push(line.trim());
            }
        }

        // Add the last chunk if it exists
        if (currentChunk.length > 0 && currentId) {
            chunks.push({
                content: currentChunk.join(' '),
                id: currentId
            });
        }

        return chunks;
    }
}