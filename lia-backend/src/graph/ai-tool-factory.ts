import {ChatOpenAI} from '@langchain/openai';

const apiKey = process.env.DEEP_SEEK_V3;

export function writingChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 1.3,
        apiKey,
        maxTokens: 1000
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}

export function deterministicChatModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 0.5,
        apiKey,
        maxTokens: 200
    }, {
        baseURL: 'https://api.deepseek.com',
    });
}