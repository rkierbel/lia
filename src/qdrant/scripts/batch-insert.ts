import {QdrantClient} from "@qdrant/js-client-rest";
import {RagPipeline} from "../../offline-rag-prep/rag-pipeline.js";
import {MarkdownTextSplitter} from "../../offline-rag-prep/markdown-text-splitter.js";
import {LegalArticlePoint} from "../../interface/legal-article-point.js";

const client = new QdrantClient({host: "localhost", port: 6333});

const points = await new RagPipeline(new MarkdownTextSplitter()).textToPoints('../../public/legal-documents/law/brussels_housing_code.md', 'brussels-housing-code', 'law');
console.log('points successfully mapped!', points.length);
const ids = await resolveIds(points);
const payloads = await resolvePayloads(points);
const vectors = await resolveVectors(points);

if (vectors.length === ids.length && vectors.length === payloads.length) {
    console.log('length of vectors matches ids & payloads, upserting data ', vectors.length);

    client.upsert("{belgian_law}", { //TODO -> change me !
        batch: {
            ids, payloads, vectors
        }
    }).then(res => console.log('finished upserting with result ', res));
}

async function resolveIds(pts: LegalArticlePoint[]): Promise<string[]> {
    return pts.map(p => p.id)
}

async function resolvePayloads(pts: LegalArticlePoint[]): Promise<{ sourceName: string, sourceType: string, elementRef: string }[]> {
    return pts.map(p => p.payload);
}

async function resolveVectors(pts: LegalArticlePoint[]): Promise<number[][]> {
    return pts.map(p => p.vector);
}
