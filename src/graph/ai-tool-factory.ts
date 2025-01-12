import {ChatOpenAI} from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = "";

/**
 * Factory function to create the ChatOpenAI model instance with tools bound.
 */
export function createChatModel() {
    return new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
        apiKey,
    });
}