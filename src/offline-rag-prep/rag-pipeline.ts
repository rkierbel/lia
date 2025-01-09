import {MarkdownTextSplitter} from './markdown-text-splitter.js';
import {jinaEmbeddings} from "../models/jina-embeddings.js" ;
import {LegalArticlePoint, LegalSource} from "../interface/legal-article-point.js";
import {v4 as uuid} from 'uuid';

/*
     TODO ->
     2) create function to insert points into collection
     3) try sample query on collection
     4) create langgraph
     5) create UI
*/
export class RagPipeline {

    constructor(private textSplitter: MarkdownTextSplitter) {
        this.textSplitter = new MarkdownTextSplitter();
    }

    public async textToPoints(sourcePath: string,
                              sourceName: string,
                              sourceType: LegalSource): Promise<LegalArticlePoint[]> {
        const chunks = await this.textSplitter.splitMarkdownByHeaders(sourcePath);
        const points: LegalArticlePoint[] = [];

        for (const chunk of chunks) { // handle promise error surround by try / catch
            const elementRef = [sourceName, chunk.id].join('-');
            const articleVector: number[] = await jinaEmbeddings.embedDocuments([chunk.content]).then(v => v[0]);

            points.push({
                id: uuid(),
                vector: articleVector,
                payload: {
                    sourceName,
                    sourceType,
                    elementRef
                }
            });
        }
        console.log('Vectorized ' + points.length + ' articles.');
        return points;
    }
}