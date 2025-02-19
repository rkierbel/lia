#!/usr/bin/env tsx
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SplitPDFOptions {
    inputPath: string;
    startPage: number;
    endPage: number;
    outputPath: string;
}

interface PrepworkToMarkdownOptions {
    inputPdfPath: string;
    outputMarkdownPath: string;
}

class PDFProcessor {
    private readonly pythonPath: string;
    private readonly scriptsDir: string;

    constructor(
        pythonPath: string = 'python',
        scriptsDir: string = dirname(__dirname)
    ) {
        this.pythonPath = pythonPath;
        this.scriptsDir = scriptsDir;

        // Debug logging
        console.log('Python path:', this.pythonPath);
        console.log('Scripts directory:', this.scriptsDir);
    }

    /**
     * Executes a Python script and returns a promise that resolves with the output
     */
    private executePythonScript(scriptName: string, args: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            const scriptPath = join(this.scriptsDir, scriptName);
            console.log('Executing script:', scriptPath);
            console.log('With arguments:', args);

            const process = spawn(this.pythonPath, [scriptPath, ...args], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
                console.error('Python stderr:', data.toString());
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(`Script execution failed with code ${code}. Error: ${stderr}`));
                }
            });

            process.on('error', (err) => {
                console.error('Process error:', err);
                reject(new Error(`Failed to start Python process: ${err.message}`));
            });
        });
    }

    /**
     * Splits a PDF file based on the given page range, start and end inclusive
     */
    async splitPDF({ inputPath, startPage, endPage, outputPath }: SplitPDFOptions): Promise<string> {
        try {
            const args = [
                inputPath,
                startPage.toString(),
                endPage.toString(),
                outputPath
            ];

            return await this.executePythonScript('split-pdf.py', args);
        } catch (error) {
            throw new Error(`Failed to split PDF: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Converts a PDF to markdown
     */
    async convertPrepworkToMarkdown({ inputPdfPath, outputMarkdownPath }: PrepworkToMarkdownOptions): Promise<string> {
        try {
            const args = [
                inputPdfPath,
                outputMarkdownPath
            ];

            return await this.executePythonScript('prepwork-to-md.py', args);
        } catch (error) {
            throw new Error(`Failed to convert PDF to markdown: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

function printUsage() {
    console.log(`
Usage: 
  Split PDF:
    npx tsx pdf-processor.ts split <input-pdf> <start-page> <end-page> <output-pdf>

  Convert PDF to Markdown:
    npx tsx pdf-processor.ts convert <input-pdf> <output-markdown>

Options:
  --python-path    Path to Python executable (default: 'python3')
  --scripts-dir    Directory containing Python scripts (default: ./python_scripts)

Examples:
  npx tsx pdf-processor.ts split input.pdf 1 5 output.pdf
  npx tsx pdf-processor.ts convert input.pdf output.md
  npx tsx pdf-processor.ts split input.pdf 1 5 output.pdf --python-path /usr/local/bin/python3
  `);
}

async function handleCLI() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        printUsage();
        process.exit(0);
    }

    // Parse options
    const pythonPath = args.includes('--python-path')
        ? args[args.indexOf('--python-path') + 1]
        : 'python';
    const scriptsDir = args.includes('--scripts-dir')
        ? args[args.indexOf('--scripts-dir') + 1]
        : join(dirname(__dirname), 'scripts');

    // Remove options from args
    const command = args[0];
    const commandArgs = args
        .filter((_, index) => !args[index - 1]?.startsWith('--'))
        .filter(arg => !arg.startsWith('--'))
        .slice(1);

    const processor = new PDFProcessor(pythonPath, scriptsDir);

    try {
        switch (command) {
            case 'split': {
                if (commandArgs.length !== 4) {
                    console.error('Error: Split command requires 4 arguments');
                    printUsage();
                    process.exit(1);
                }

                const [inputPath, startPage, endPage, outputPath] = commandArgs;
                const result = await processor.splitPDF({
                    inputPath,
                    startPage: parseInt(startPage, 10),
                    endPage: parseInt(endPage, 10),
                    outputPath
                });
                console.log(result);
                break;
            }

            case 'convert': {
                if (commandArgs.length !== 2) {
                    console.error('Error: Convert command requires 2 arguments');
                    printUsage();
                    process.exit(1);
                }

                const [inputPdfPath, outputMarkdownPath] = commandArgs;
                const result = await processor.convertPrepworkToMarkdown({
                    inputPdfPath,
                    outputMarkdownPath
                });
                console.log(result);
                break;
            }

            default:
                console.error(`Unknown command: ${command}`);
                printUsage();
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Check if file is being run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    handleCLI();
}

export { PDFProcessor, type SplitPDFOptions, type PrepworkToMarkdownOptions };

/**
 * usage in TS code:
 * import { PDFProcessor } from './scripts/pdf-processor.js';
 *
 * const processor = new PDFProcessor();
 * await processor.splitPDF({
 *   inputPath: 'input.pdf',
 *   startPage: 1,
 *   endPage: 5,
 *   outputPath: 'output.pdf'
 * });
 */