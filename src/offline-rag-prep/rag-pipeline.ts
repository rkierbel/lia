import {MarkdownTextSplitter} from './markdown-text-splitter.js';
import {jinaEmbeddings} from "../models/jina-embeddings.js" ;
import {LegalArticlePoint} from "../interface/legal-article-point.js";
import {ArticleLocator} from "./article-locator.js";

/*
     TODO ->
     1) create collection + index for payload
     2) create function to insert points into collection
     3) try sample query on collection
     4) create langgraph
     5) create UI
*/
export class RagPipeline {

    constructor(private textSplitter: MarkdownTextSplitter,
                private articleLocator: ArticleLocator) {
        this.textSplitter = new MarkdownTextSplitter();
        this.articleLocator = new ArticleLocator();
    }

    public async textToPoints(sourcePath: string,
                              sourceStructurePath: string,
                              sourceName: string): Promise<LegalArticlePoint[]> {
        const chunks = await this.textSplitter.splitMarkdownByHeaders(sourcePath);
        const points: LegalArticlePoint[] = [];

        for (const chunk of chunks) { // handle promise error surround by try / catch
            const articleId = [sourceName, chunk.id].join('-');
            const context = await this.articleLocator.contextualize(chunk.id, sourceStructurePath).then(ctxt => ctxt);
            const articleVector: number[] = await jinaEmbeddings.embedDocuments([chunk.content]).then(v => v[0]);

            points.push({
                id: articleId,
                vector: articleVector,
                payload: {
                    sourceName,
                    sourceType: 'law',
                    context
                }
            });
        }
        console.log('Vectorized ' + points.length + ' articles.');
        return points;
    }
}