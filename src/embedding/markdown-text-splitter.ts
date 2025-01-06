import * as fs from 'node:fs/promises';

export class MarkdownTextSplitter {

    /**
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

        // Regular expression to match markdown headers (both # and === or --- style)
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

    public async extractStructure(inputPath: string, outputPath: string): Promise<void> {
        try {
            const content = await fs.readFile(inputPath, 'utf-8');

            const lines = content.split('\n');
            const headerRegex = /^#{1,6}/;
            const headers: string[] = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const nextLine = lines[i + 1];

                if (headerRegex.test(line)) {
                    headers.push(line);
                } else if (nextLine) {
                    headers.push(line);
                    headers.push(nextLine);
                    i++;
                }
            }

            const trimmedContent = headers.join('\n');
            await fs.writeFile(outputPath, trimmedContent, 'utf-8');
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to process markdown file: ${error.message}`);
            }
            throw error;
        }
    }
}

