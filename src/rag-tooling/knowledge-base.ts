import {MarkdownTextSplitter} from './markdown-text-splitter.js';
import {v4 as uuid} from 'uuid';
import {QdrantVectorStore} from '@langchain/qdrant';
import {CustomDocument} from '../interface/custom-document.js';
import {aiModelManager} from "../graph/utils/ai-model-manager.js";
import {LegalSource} from "../interface/legal-source-name.js";
import {ChunkContextPrefix} from "../interface/chunk-context-prefix.js";

export class KnowledgeBase {

    public static readonly instance: KnowledgeBase = new KnowledgeBase();
    private textSplitter;

    private constructor() {
        this.textSplitter = new MarkdownTextSplitter();
    }

    public async setUpKnowledgeBase(docs: CustomDocument[]) {
        await QdrantVectorStore.fromDocuments(
            docs,
            aiModelManager.embeddingsModel(),
            {
                url: process.env.VECTOR_DB_URL,
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

    public async addPrepWorkDocs(sourcePath: string,
                                 sourceName: LegalSource,
                                 sourceEntity: string,
                                 chunkPrefix: ChunkContextPrefix) {
        const vs = await aiModelManager.vectorStore();
        const chunks = await this.textSplitter.splitMarkdownOnLvl4Headers(sourcePath, chunkPrefix);
        const docs: CustomDocument[] = chunks.map(c => {
            return {
                id: uuid(),
                pageContent: c.content,
                metadata: {
                    sourceName,
                    sourceType: 'preparatory-work',
                    sourceEntity
                }
            }
        });
        await vs.addDocuments(docs);
    }

    public async addLawDocs(sourcePath: string,
                            sourceName: LegalSource,
                            sourceEntity: string) {
        const vs = await aiModelManager.vectorStore();
        const chunks = await this.textSplitter.splitMarkdownByArticleHeaders(sourcePath);
        const docs: CustomDocument[] = chunks.map(c => {
            return {
                id: uuid(),
                pageContent: c.content,
                metadata: {
                    sourceName,
                    sourceType: 'law',
                    elementRef: [sourceName, c.id].join('-'),
                    sourceEntity
                }
            }
        });
        await vs.addDocuments(docs);
    }
}