import {Chunk} from '../interface/chunk.js';
import {CustomDocument} from './custom-document.js';

export class MarkdownLoader {

    public async load(chunks: Chunk[]): Promise<CustomDocument[]>{
        return chunks.map(
            chunk => new CustomDocument({
                pageContent: chunk.content,
                metadata: {
                    partitionKey: chunk.metadata.partitionKey,
                    contentId: chunk.metadata.contentId
                }
            })
        )
    }
}


/*
constructor(private loader = new UnstructuredLoader(
        'public/housing_code.md',
        {
            apiKey: 'dVUvbzVnLji33vFpReFWZscLLyORF5',
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