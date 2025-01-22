import {MarkdownTextSplitter} from './markdown-text-splitter.js';
import {v4 as uuid} from 'uuid';
import {QdrantVectorStore} from '@langchain/qdrant';
import dotenv from 'dotenv';
import {CustomDocument, LegalSource} from '../interface/custom-document.js';
import {embeddingsModel, vectorStore} from "../graph/utils/ai-tool-factory";

dotenv.config({path: '/lia/.env'});

export class KnowledgeBase {

    public static readonly instance: KnowledgeBase = new KnowledgeBase();
    private textSplitter;

    private constructor() {
        this.textSplitter = new MarkdownTextSplitter();
    }

    public async cacheQuestionAnswer(question: string,
                                     answer: string) {
        const vs = await vectorStore();
        const answerId = uuid();

        await vs.addDocuments([{
            id: answerId,
            pageContent: answer,
            metadata: {
                sourceType: 'cached-answer',
            }
        }]);
        await vs.addDocuments([{
            id: uuid(),
            pageContent: question,
            metadata: {
                answerId: answerId
            }
        }]);
    }

    public async addLegalDocs(sourcePath: string,
                              sourceName: LegalSource,
                              sourceType: string,
                              sourceEntity: string) {
        const vs = await vectorStore();
        const docs = await this.chunksToDocs(sourcePath, sourceName, sourceType, sourceEntity);

        await vs.addDocuments(docs);
    }

    public async setUpKnowledgeBase(sourcePath: string,
                                    sourceName: LegalSource,
                                    sourceType: string,
                                    sourceEntity: string) {
        const docs = await this.chunksToDocs(sourcePath, sourceName, sourceType, sourceEntity);
        await QdrantVectorStore.fromDocuments(
            docs,
            embeddingsModel(),
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
        const docs: CustomDocument[] = chunks.map(c => {
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