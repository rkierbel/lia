import {ChatOpenAI} from "@langchain/openai";

const apiKey = process.env.OPEN_AI;

export function createChatModel() {
    return new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
        apiKey,
    });
}