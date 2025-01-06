import {MarkdownTextSplitter} from './markdown-text-splitter.js';
import {MarkdownLoader} from './markdown-loader.js';
import {OfflineTextEmbedding} from './offline-text-embedding.js';

export class RagPipeline {

    constructor(
        private textSplitter: MarkdownTextSplitter,
        private loader: MarkdownLoader,
        private offlineEmbedding: OfflineTextEmbedding
    ) {
        this.textSplitter = new MarkdownTextSplitter();
        this.loader = new MarkdownLoader();
        this.offlineEmbedding = new OfflineTextEmbedding();
    }

    public pipe(filePath: string) {
        this.textSplitter.splitMarkdownByHeaders(filePath)
            .then(mdChunks => this.loader.contextualize(mdChunks))
            .then(chunks => this.loader.load(chunks))
            .then(docs => docs.forEach(d => this.offlineEmbedding.embed(d.pageContent)));
        // then map to entities & save in Milvus!
    }

}