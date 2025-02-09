import {ChatOpenAI} from '@langchain/openai';
import {JinaEmbeddings} from "@langchain/community/embeddings/jina";
import {QdrantVectorStore} from "@langchain/qdrant";

export enum AiToolProvider  {OPENAI, DEEPSEEK}

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

export function creativeModel(aiToolProvider: AiToolProvider) {
    switch(aiToolProvider) {
        case AiToolProvider.DEEPSEEK: return creativeDeepSeekChatModel();
        case AiToolProvider.OPENAI: return creativeOpenAiChatModel();
        default: return creativeDeepSeekChatModel();
    }
}

export function analyticsModel(aiToolProvider: AiToolProvider) {
    switch(aiToolProvider) {
        case AiToolProvider.DEEPSEEK: return analyticsDeepSeekChatModel();
        case AiToolProvider.OPENAI: return analyticsOpenAiChatModel();
        default: return analyticsDeepSeekChatModel();
    }
}

export function deterministicModel(aiToolProvider: AiToolProvider) {
    switch(aiToolProvider) {
        case AiToolProvider.DEEPSEEK: return deterministicDeepSeekChatModel();
        case AiToolProvider.OPENAI: return deterministicOpenAiChatModel();
        default: return deterministicDeepSeekChatModel();
    }
}

function creativeDeepSeekChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 1.3,
        apiKey: process.env.DEEPSEEK,
        maxTokens: 1200
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}


function analyticsDeepSeekChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 0.94,
        apiKey: process.env.DEEPSEEK,
        maxTokens: 1024
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}

function deterministicDeepSeekChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 0.35,
        apiKey: process.env.DEEPSEEK,
        maxTokens: 512
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}

function creativeOpenAiChatModel() {
    return new ChatOpenAI({
        model: "gpt-4o",
        temperature: 1,
        apiKey: process.env.OPEN_AI,
        maxTokens: 1024
    });
}

function analyticsOpenAiChatModel() {
    return new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0.82,
        apiKey: process.env.OPEN_AI,
        maxTokens: 1024
    });
}

function deterministicOpenAiChatModel() {
    return new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.25,
        apiKey: process.env.OPEN_AI,
        maxTokens: 512
    });
}