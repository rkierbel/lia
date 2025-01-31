import {readFileSync, writeFileSync} from 'fs';

class TextualDataWorker {
    private static readonly ARTICLE_PATTERN = /^\s*Art\.\s*(\d{1,3}(?:\/\d+)*(?:bis|ter|quater|[a-z]*es)?(?:\/\d+)?(?:\.\d+)*)\.*/;
    private static readonly MD_ARTICLE_PATTERN = /^#{1,5}\s*Art\.\s*(\d{1,3}(?:\/\d+)*(?:bis|ter|quater|[a-z]*es)?(?:\/\d+)?(?:\.\d+)*)\.\s*/gm;
    private static readonly EMPTY_ARTICLE_PATTERN = /#{1,5}\s*Art\.\s*\d+\.\s*(?:\n\s*\[\.{3}\]|\n\s*$|\n\s*(?=#{1,5}\s*Art\.))/gm;
    private static readonly HEADS_TO_DEL_PATTERN = /(Titre|Chapitre|Sous-titre|Section|Sous-section)\s+(?:[IVX]+|\d+)?(?:er|re)?\.(?:\s+-\s+[^\n.]+)?/gi;
    private static readonly LEGAL_REFERENCE_PATTERN = /-{10,}[\s\S]*?\([0-9]+\)<[^>]+>/g;
    private static readonly FOOTNOTE_PATTERN = /\[[0-9]\s+([^\]]+)\][0-9]/g;
    private static readonly NUMBERED_LINE_PATTERN = /\(\d+\)/g;
    private static readonly FUTURE_LAW_PATTERN = /DROIT FUTUR/g;

    processText(input: string): string {
        // Split the text into lines for processing
        // Remove legal references
        const text = input
            .replace(TextualDataWorker.LEGAL_REFERENCE_PATTERN, '')
            .replace(TextualDataWorker.FOOTNOTE_PATTERN, '$1')
            .replace(/§§/g, 'Paragraphes')
            .replace(/§/g, 'Paragraphe')
            .replace(/<[^>]*>/g, '')
            .replace(TextualDataWorker.NUMBERED_LINE_PATTERN, '')
            .replace(TextualDataWorker.HEADS_TO_DEL_PATTERN, '')
            .replace(TextualDataWorker.FUTURE_LAW_PATTERN, '');

        // Split into articles
        const articles: string[] = [];
        let currentArticle: string[] = [];
        let isInArticle = false;

        const lines = text.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check if line contains article number
            if (trimmedLine.match(TextualDataWorker.ARTICLE_PATTERN)) {
                // If we were processing a previous article, save it
                if (currentArticle.length > 0) {
                    articles.push(currentArticle.join('\n'));
                    currentArticle = [];
                }
                // Add the article number with hashtags
                currentArticle.push(`#### ${trimmedLine}`);
                isInArticle = true;
            } else if (isInArticle && trimmedLine) {
                // Add content lines only if we're in an article and line is not empty
                currentArticle.push(trimmedLine);
            }
        }

        // Add the last article if exists
        if (currentArticle.length > 0) {
            articles.push(currentArticle.join('\n'));
        }

        // Join all processed articles
        return articles
            .join('\n\n')
            .replace(TextualDataWorker.MD_ARTICLE_PATTERN, '$&\n')
            .replace(TextualDataWorker.EMPTY_ARTICLE_PATTERN, '');
    }

    processFile(inputPath: string, outputPath: string): void {
        try {
            // Read input file
            const input = readFileSync(inputPath, 'utf-8');

            // Process the text
            const processedText = this.processText(input);

            // Write to output file
            writeFileSync(outputPath, processedText);

            console.log(`Successfully processed ${inputPath} to ${outputPath}`);
        } catch (error) {
            console.error('Error processing file:', error);
            process.exit(1);
        }
    }
}

// Get command line arguments
const [, , inputFile, outputFile] = process.argv;

// Validate arguments
if (!inputFile || !outputFile) {
    console.error('Usage: npx tsx text-data-worker.ts <input_file.txt> <output_file.md>');
    process.exit(1);
}

// Process the file
const worker = new TextualDataWorker();
worker.processFile(inputFile, outputFile);

export default TextualDataWorker;