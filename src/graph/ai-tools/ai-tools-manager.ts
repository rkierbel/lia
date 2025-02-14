import { ChatOpenAI } from '@langchain/openai';
import { JinaEmbeddings } from "@langchain/community/embeddings/jina";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {ChatDeepSeek} from "@langchain/deepseek";
import {AiProvider} from "./ai-provider.js";

export enum ModelPurpose {
    CREATIVE = 'CREATIVE',
    ANALYTICS = 'ANALYTICS',
    DETERMINISTIC = 'DETERMINISTIC'
}

type ModelConfig = {
    temperature: number;
    maxTokens: number;
    model: string;
}

type BaseModelResponse = ChatOpenAI | ChatGoogleGenerativeAI | ChatDeepSeek;

class AiToolsManager {
    private static instance: AiToolsManager;
    private readonly provider: AiProvider = process.env.AI_PROVIDER as AiProvider ?? AiProvider.GOOGLE;

    private constructor() {}

    public static getInstance(): AiToolsManager {
        if (!AiToolsManager.instance) {
            AiToolsManager.instance = new AiToolsManager();
        }
        return AiToolsManager.instance;
    }

    public createModel(purpose: ModelPurpose): BaseModelResponse {
        const config = this.getModelConfig(purpose, this.provider);

        switch (this.provider) {
            case AiProvider.DEEPSEEK:
                return new ChatDeepSeek({
                    ...config,
                    apiKey: process.env.DEEPSEEK,
                });

            case AiProvider.OPENAI:
                return new ChatOpenAI({
                    ...config,
                    apiKey: process.env.OPEN_AI,
                });

            case AiProvider.GOOGLE:
                return new ChatGoogleGenerativeAI({
                    model: config.model,
                    temperature: config.temperature,
                    maxOutputTokens: config.maxTokens,
                });

            default:
                throw new Error(`Unsupported AI provider: ${this.provider}`);
        }
    }

    // Embeddings and Vector Store methods remain unchanged
    public embeddingsModel(): JinaEmbeddings {
        return new JinaEmbeddings({
            apiKey: process.env.JINA,
            model: 'jina-embeddings-v3',
            dimensions: 1024,
            normalized: true
        });
    }

    public async vectorStore(): Promise<QdrantVectorStore> {
        return await QdrantVectorStore.fromExistingCollection(
            this.embeddingsModel(),
            {
                url: process.env.QDRANT_URL,
                collectionName: 'belgian_law',
                apiKey: process.env.QDRANT_API_KEY
            }
        );
    }

    private getModelConfig(purpose: ModelPurpose, provider: AiProvider): ModelConfig {
        const configs: Record<ModelPurpose, Record<AiProvider, ModelConfig>> = {
            [ModelPurpose.CREATIVE]: {
                [AiProvider.DEEPSEEK]: {
                    model: "deepseek-chat",
                    temperature: 1.3,
                    maxTokens: 1200
                },
                [AiProvider.OPENAI]: {
                    model: "gpt-4o",
                    temperature: 1,
                    maxTokens: 1200
                },
                [AiProvider.GOOGLE]: {
                    model: "gemini-2.0-flash",
                    temperature: 1,
                    maxTokens: 1600
                }
            },
            [ModelPurpose.ANALYTICS]: {
                [AiProvider.DEEPSEEK]: {
                    model: "deepseek-chat",
                    temperature: 0.94,
                    maxTokens: 1024
                },
                [AiProvider.OPENAI]: {
                    model: "gpt-4o",
                    temperature: 0.7,
                    maxTokens: 1024
                },
                [AiProvider.GOOGLE]: {
                    model: "gemini-1.5-flash",
                    temperature: 0.7,
                    maxTokens: 1024
                }
            },
            [ModelPurpose.DETERMINISTIC]: {
                [AiProvider.DEEPSEEK]: {
                    model: "deepseek-chat",
                    temperature: 0.35,
                    maxTokens: 512
                },
                [AiProvider.OPENAI]: {
                    model: "gpt-4o-mini",
                    temperature: 0.3,
                    maxTokens: 512
                },
                [AiProvider.GOOGLE]: {
                    model: "gemini-1.5-flash",
                    temperature: 0.3,
                    maxTokens: 512
                }
            }
        };

        return configs[purpose][provider];
    }
}

export const aiTools = AiToolsManager.getInstance();