import * as fs from 'node:fs/promises';

export class MarkdownTextSplitter {

    /*
     * Splits a Markdown document into chunks based on # headers
     * @param {string} markdownFilePath - The path to a Markdown document to split
     * @returns {Promise<string[]>} Array of chunks
     */
    public async splitMarkdownByHeaders(markdownFilePath: string): Promise<string[]> {
        const markdown = await fs.readFile(markdownFilePath, {
            encoding: 'utf-8',
            flag: 'r'
        });

        // Split the document into lines
        const lines: string[] = markdown.split('\n');

        const chunks: string[] = [];
        let currentChunk: string[] = [];

        // Regular expression to match # markdown headers
        const headerRegex = /^#{1,6}/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (headerRegex.test(line)) {
                // Save previous chunk if it exists
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.join('\n'));
                    currentChunk = [];
                }
                // Start new chunk with the header
                currentChunk.push(line);

            } else {
                currentChunk.push(line);
            }
        }

        // Add the last chunk if it exists
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n'));
        }

        return chunks;
    }
}

