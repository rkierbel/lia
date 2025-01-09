import {QdrantClient} from "@qdrant/js-client-rest";
import {LegalDocument} from "../../interface/legal-document.js";
import {KnowledgeBase} from "../../offline-rag-prep/knowledge-base.js";

const client = new QdrantClient({host: "localhost", port: 6333});

const docs = await new KnowledgeBase()
    .documents('../../public/legal-documents/law/brussels_housing_code.md', 'brussels-housing-code', 'law');
console.log('points successfully mapped!', docs.length);
const ids = await resolveIds(docs);
const payloads = await resolvePayloads(docs);
const vectors = await resolveContent(docs);

if (vectors.length === ids.length && vectors.length === payloads.length) {
    console.log('length of vectors matches ids & payloads, upserting data ', vectors.length);

    client.upsert("{belgian_law}", { //TODO -> change me !
        batch: {
            ids, payloads, vectors
        }
    }).then(res => console.log('finished upserting with result ', res));
}

async function resolveIds(pts: LegalDocument[]): Promise<string[]> {
    return pts.map(p => p.id);
}

async function resolvePayloads(pts: LegalDocument[]): Promise<{ sourceName: string, sourceType: string, elementRef: string }[]> {
    return pts.map(p => p.metadata);
}

async function resolveContent(pts: LegalDocument[]): Promise<number[][]> {
    return pts.map(p => p.pageContent);
}
