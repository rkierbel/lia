import {MarkdownTextSplitter} from './markdown-text-splitter.js';
import {jinaEmbeddings} from "../models/jina-embeddings.js" ;
import {LegalArticleEmbedding} from "../interface/legal-article-embedding.js";

export class RagPipeline {

    constructor(private textSplitter: MarkdownTextSplitter,) {
        this.textSplitter = new MarkdownTextSplitter();
    }

    public async pipe(filePath: string, partitionKey: string) {
        const chunks = await this.textSplitter.splitMarkdownByHeaders(filePath);
        const embeddings: LegalArticleEmbedding[] = [];

        for (const chunk of chunks) {
            const articleId = [partitionKey, chunk.id].join('-');
            const articleVector: number[] = await jinaEmbeddings.embedDocuments([chunk.content]).then(v => v[0]);
            embeddings.push({articleVector, articleId, partitionKey});
        }

    }
}