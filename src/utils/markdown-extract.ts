import fs from 'node:fs/promises';

async function extractStructure(inputPath: string, outputPath: string): Promise<void> {
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