import {MarkdownTextSplitter} from './markdown-text-splitter.js';
import {v4 as uuid} from 'uuid';
import {QdrantVectorStore} from "@langchain/qdrant";
import {JinaEmbeddings} from "@langchain/community/embeddings/jina";
import dotenv from "dotenv";
import {LegalDocument, LegalSource} from "../interface/legal-document.js";

dotenv.config({path: "/lia/.env"});

const embeddingModel = new JinaEmbeddings({
    apiKey: process.env.JINA,
    model: "jina-embeddings-v3",
    dimensions: 1024,
    normalized: true
});

export class KnowledgeBase {

    private textSplitter;

    constructor() {
        this.textSplitter = new MarkdownTextSplitter();
    }

    public async retriever(sourceName: Exclude<LegalSource, "unknown">) {
        const filter = {
            must: [
                {key: "metadata.sourceName", match: {value: sourceName}},
                {key: "metadata.sourceType", match: {value: "law"}},
            ]
        };
        return new QdrantVectorStore(embeddingModel, {
                url: "http://localhost:6333",
                collectionName: "belgian_law"
            }).asRetriever({searchType: "similarity"}, filter);
    }

    public async setUpKnowledgeBase(sourcePath: string,
                                    sourceName: string,
                                    sourceType: LegalSource) {
        const docs = await this.documents(sourcePath, sourceName, sourceType);
        await QdrantVectorStore.fromDocuments(
            docs,
            embeddingModel,
            {
                url: "http://localhost:6333",
                collectionName: "belgian_law",
                collectionConfig: {
                    vectors: {
                        size: 1024,
                        distance: "Cosine",
                        datatype: "float32",
                        on_disk: true
                    }, hnsw_config: {
                        payload_m: 25,
                        m: 64,
                        ef_construct: 512,
                        max_indexing_threads: 10,
                        on_disk: true
                    },
                    quantization_config: {
                        scalar: {
                            type: "int8",
                            quantile: 0.99,
                            always_ram: false
                        }
                    }
                }
            });
    }

    public async documents(sourcePath: string,
                            sourceName: string,
                            sourceType: LegalSource) {
        const chunks = await this.textSplitter.splitMarkdownByHeaders(sourcePath);
        const docs: LegalDocument[] = chunks.map(c => {
            return {
                id: uuid(),
                pageContent: c.content,
                metadata: {
                    sourceName,
                    sourceType,
                    elementRef: [sourceName, c.id].join("-")
                }
            }
        });
        return docs;
    }
}