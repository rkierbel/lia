import * as fs from 'node:fs/promises';
import {Chunk} from '../interface/chunk.js';

export class MarkdownTextSplitter {

    constructor() {
    }

    public async splitMarkdownOnLvl4Headers(markdownFilePath: string): Promise<Chunk[]> {
        const markdown = await fs.readFile(markdownFilePath, {
            encoding: 'utf-8',
            flag: 'r'
        });

        return markdown.split('####').map(str => {
            return {
                content:['(prep work BE civil code)', str.replaceAll('\r\n', '').trim()].join(' ')
            }
        })

    }

    // Splits a Markdown document into chunks based on # headers
    public async splitMarkdownByArticleHeaders(markdownFilePath: string): Promise<Chunk[]> {
        const markdown = await fs.readFile(markdownFilePath, {
            encoding: 'utf-8',
            flag: 'r'
        });

        const lines: string[] = markdown.split('\n').map(l => l.trim()).filter(l => l !== '');
        const chunks: Chunk[] = [];
        let currentChunk: string[] = [];
        let currentId: string = '';

        // Regular expression to match article headers like "#### Art. 4." or "#### Art. 44/4." or "#### Art. 44bis." or "#### Art. 44bis/4." or "#### Art. 1.1." or "#### Art. 1.1.1"
        const headerRegex = /^#{1,6}\s*Art\.\s*(\d{1,3}(?:\/\d+)*(?:bis|ter|quater|[a-z]*es)?(?:\/\d+)?(?:\.\d+)*)\.*/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

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
                if (headerMatch[1]) {
                    currentId = headerMatch[1];
                    currentId = currentId.replace(/\.$/, '');
                }
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