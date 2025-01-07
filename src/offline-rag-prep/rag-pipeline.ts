import {MarkdownTextSplitter} from './markdown-text-splitter.js';
import {OfflineTextEmbedding} from './offline-text-embedding.js';

export class RagPipeline {

    constructor(
        private textSplitter: MarkdownTextSplitter,
        private offlineEmbedding: OfflineTextEmbedding
    ) {
        this.textSplitter = new MarkdownTextSplitter();
        this.offlineEmbedding = new OfflineTextEmbedding();
    }

    public async pipe(filePath: string, partitionKey: string) {
        const chunks = await this.textSplitter.splitMarkdownByHeaders(filePath);

        for (const chunk of chunks) {
            const vectors = await this.offlineEmbedding.embed(chunk.content);
            if (vectors.length === 0) console.log('error fetching vectors for chunk with id ' + chunk.id);
            else vectors.forEach(v => console.log(v))
        }
    }
}