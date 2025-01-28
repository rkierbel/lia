import {ChatOpenAI} from '@langchain/openai';
import {JinaEmbeddings} from "@langchain/community/embeddings/jina";
import {QdrantVectorStore} from "@langchain/qdrant";

export function juristChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 1.3,
        apiKey: process.env.DEEPSEEK,
        maxTokens: 1024
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}


export function writingChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 0.94,
        apiKey: process.env.DEEPSEEK,
        maxTokens: 1024
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}


export function deterministicChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 0.35,
        apiKey: process.env.DEEPSEEK,
        maxTokens: 512
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

export async function vectorStore() {
    return await QdrantVectorStore.fromExistingCollection(embeddingsModel(), {
        url: process.env.VECTOR_DB_URL,
        collectionName: 'belgian_law'
    });
}