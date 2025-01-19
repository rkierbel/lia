import {ChatOpenAI} from '@langchain/openai';
import {JinaEmbeddings} from "@langchain/community/embeddings/jina";

export function writingChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 1.23,
        apiKey: process.env.DEEP_SEEK_V3,
        maxTokens: 1000
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}

export function deterministicChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 0.5,
        apiKey: process.env.DEEP_SEEK_V3,
        maxTokens: 400
    }, {
        baseURL: 'https://api.deepseek.com',
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