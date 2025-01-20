import {MarkdownTextSplitter} from './markdown-text-splitter.js';
import {v4 as uuid} from 'uuid';
import {QdrantVectorStore} from '@langchain/qdrant';
import {JinaEmbeddings} from '@langchain/community/embeddings/jina';
import dotenv from 'dotenv';
import {LegalDocument, LegalSource} from '../interface/legal-document.js';

dotenv.config({path: '/lia/.env'});

const embeddingModel = new JinaEmbeddings({
    apiKey: "jina_3f47a80afd5b42d9985ba7fca8bedfe9WHcMCRMvQ7lQ-FheqfABgp7LF2ae",
    model: 'jina-embeddings-v3',
    dimensions: 1024,
    normalized: true
});

export class KnowledgeBase {

    public static readonly instance: KnowledgeBase = new KnowledgeBase();

    private textSplitter;

    private constructor() {
        this.textSplitter = new MarkdownTextSplitter();
    }

    public async addDocs(sourcePath: string,
                         sourceName: LegalSource,
                         sourceType: string,
                         sourceEntity: string) {
        const docs = await this.chunksToDocs(sourcePath, sourceName, sourceType, sourceEntity);
        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddingModel, {
                url: 'http://localhost:6333',
                collectionName: 'belgian_law'
            });
        await vectorStore.addDocuments(docs);
    }

    public async setUpKnowledgeBase(sourcePath: string,
                                    sourceName: LegalSource,
                                    sourceType: string,
                                    sourceEntity: string) {
        const docs = await this.chunksToDocs(sourcePath, sourceName, sourceType, sourceEntity);
        await QdrantVectorStore.fromDocuments(
            docs,
            embeddingModel,
            {
                url: process.env.DB_URL,
                collectionName: 'belgian_law',
                collectionConfig: {
                    vectors: {
                        size: 1024,
                        distance: 'Cosine',
                        datatype: 'float32',
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
                            type: 'int8',
                            quantile: 0.99,
                            always_ram: false
                        }
                    }
                }
            });
    }

    public async chunksToDocs(sourcePath: string,
                              sourceName: LegalSource,
                              sourceType: string,
                              sourceEntity: string) {
        const chunks = await this.textSplitter.splitMarkdownByHeaders(sourcePath);
        const docs: LegalDocument[] = chunks.map(c => {
            return {
                id: uuid(),
                pageContent: c.content,
                metadata: {
                    sourceName,
                    sourceType,
                    elementRef: [sourceName, c.id].join('-'),
                    sourceEntity
                }
            }
        });
        return docs;
    }
}