import {Chunk} from '../interface/chunk.js';
import {Document} from '@langchain/core/documents';

export class MarkdownLoader {

    public async load(chunks: Chunk[], partitionKey: string): Promise<Document[]>{
        return chunks.map(
            chunk => new Document({
                pageContent: chunk.content,
                metadata: {
                    articleId: [partitionKey, chunk.id].join('-')
                }
            })
        )
    }
}


/*
constructor(private loader = new UnstructuredLoader(
        'public/housing_code.md',
        {
            apiKey: process.env.UNSTRUCTURED,
            includePageBreaks: false,
            chunkingStrategy: 'by_title',
            maxCharacters: 13050,
            overlapAll: false
        }
    )) {
    }

    public async load(): Promise<Document<Record<string, string>>[]> {
        return await this.loader.load();
    }

    public logDocContents(docs: Document<Record<string, string>>[]) {
        for (const doc in docs) {
            console.log(doc);
        }
    }

 */