import {ChatOpenAI} from '@langchain/openai';
import {JinaEmbeddings} from "@langchain/community/embeddings/jina";
import {QdrantVectorStore} from "@langchain/qdrant";
import {ChatDeepSeek} from "@langchain/deepseek";


export enum AiToolProvider {
    OPENAI = 'OPENAI',
    DEEPSEEK = 'DEEPSEEK'
}

export const toolProvider = AiToolProvider.OPENAI;

type ModelConfig = {
    model: string;
    temperature: number;
    maxTokens: number;
};

export class AiModelManager {
    private static instance: AiModelManager;
    private readonly openAiKey: string;
    private readonly deepseekKey: string;
    private readonly vectorDbUrl: string;

    public static getInstance(): AiModelManager {
        if (!AiModelManager.instance) {
            AiModelManager.instance = new AiModelManager();
        }
        return AiModelManager.instance;
    }

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
                url: this.vectorDbUrl,
                collectionName: 'belgian_law'
            }
        );
    }

    public creativeModel(provider: AiToolProvider = AiToolProvider.DEEPSEEK): ChatOpenAI | ChatDeepSeek {
        return this.createModel(provider, this.modelConfigs[provider].creative);
    }

    public analyticsModel(provider: AiToolProvider = AiToolProvider.DEEPSEEK): ChatOpenAI | ChatDeepSeek {
        return this.createModel(provider, this.modelConfigs[provider].analytics);
    }

    public deterministicModel(provider: AiToolProvider = AiToolProvider.DEEPSEEK): ChatOpenAI | ChatDeepSeek {
        return this.createModel(provider, this.modelConfigs[provider].deterministic);
    }

    public llmErrorHandler = {
        handleLLMError(err: Error) {
            // Log any errors in detail
            console.error("LLM Error:", err);
        }
    };


    private readonly modelConfigs: Record<AiToolProvider, {
        creative: ModelConfig;
        analytics: ModelConfig;
        deterministic: ModelConfig;
    }> = {
        [AiToolProvider.DEEPSEEK]: {
            creative: {
                model: 'deepseek-chat',
                temperature: 1.3,
                maxTokens: 1200
            },
            analytics: {
                model: 'deepseek-chat',
                temperature: 0.94,
                maxTokens: 1024
            },
            deterministic: {
                model: 'deepseek-chat',
                temperature: 0.35,
                maxTokens: 512
            }
        },
        [AiToolProvider.OPENAI]: {
            creative: {
                model: 'gpt-4o',
                temperature: 1,
                maxTokens: 1024
            },
            analytics: {
                model: 'gpt-4o',
                temperature: 0.82,
                maxTokens: 1024
            },
            deterministic: {
                model: 'gpt-4o-mini',
                temperature: 0.25,
                maxTokens: 512
            }
        }
    };

    private constructor() {
        this.openAiKey = process.env.OPENAI ?? '';
        this.deepseekKey = process.env.DEEPSEEK ?? '';
        this.vectorDbUrl = process.env.VECTOR_DB_URL ?? '';
    }

    private createModel(
        provider: AiToolProvider,
        config: ModelConfig
    ): ChatOpenAI | ChatDeepSeek {
        const baseConfig = {
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            streaming: true,
            apiKey: provider === AiToolProvider.DEEPSEEK ? this.deepseekKey: this.openAiKey,
        };

        if (provider === AiToolProvider.DEEPSEEK) {
            console.log("[AiModelManager] - creating DeepSeekChat models");
            return new ChatDeepSeek(baseConfig);
        }

        return new ChatOpenAI(baseConfig);
    }
}

export const aiModelManager = AiModelManager.getInstance();