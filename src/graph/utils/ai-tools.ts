import {ChatOpenAI} from '@langchain/openai';
import {JinaEmbeddings} from "@langchain/community/embeddings/jina";
import {QdrantVectorStore} from "@langchain/qdrant";

export function juristDeepSeekChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 1.3,
        apiKey: process.env.DEEPSEEK,
        maxTokens: 1024
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}


export function dataAnalysisDeepSeekChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 0.94,
        apiKey: process.env.DEEPSEEK,
        maxTokens: 1024
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}

export function deterministicDeepSeekChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 0.35,
        apiKey: process.env.DEEPSEEK,
        maxTokens: 512
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}

export function juristOpenAiChatModel() {
    return new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0.9,
        apiKey: process.env.OPEN_AI,
        maxTokens: 1024
    });
}

export function contentValidationOpenAiChatModel() {
    return new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0.82,
        apiKey: process.env.OPEN_AI,
        maxTokens: 1024
    });
}

export function dataAnalysisOpenAiChatModel() {
    return new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0.70,
        apiKey: process.env.OPEN_AI,
        maxTokens: 1024
    });
}

export function deterministicOpenAiChatModel() {
    return new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.25,
        apiKey: process.env.OPEN_AI,
        maxTokens: 512
    });
}


export function embeddingsModel() {
    return new JinaEmbeddings({
        apiKey: process.env.JINA,
        model: 'jina-embeddings-v3',
        dimensions: 1024,
        normalized: true
    });
}

export async function vectorStore() {
    return await QdrantVectorStore.fromExistingCollection(embeddingsModel(), {
        url: process.env.VECTOR_DB_URL,
        collectionName: 'belgian_law'
    });
}