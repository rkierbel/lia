import {ChatPromptTemplate} from "@langchain/core/prompts";
import {tool} from "@langchain/core/tools";
import {ChatOpenAI} from "@langchain/openai";
import {z} from "zod";
import {KnowledgeBase} from "../offline-rag-prep/knowledge-base.js";

export const VALIDATOR_PROMPT = "You are a precise and thorough question content validator." +
    "Instructions:" +
    "You will receive a question as input. Upon receiving the question, you have one tasks" +
    "Your only task is to validate that the question is about law, and more specifically about one of the areas of law known by our application." +
    "If the question is not about an area of law known by our application, reply: 'no'." +
    "If the question is about an area of law known by our application, reply 'yes'." +
    "These are the only two replies you can give, nothing else, under any circumstances." +
    "If you are not given a question, just reply 'no'." +
    "Areas of law known by our application: housing law, family law, criminal law."
;

const validationPrompt = ChatPromptTemplate.fromMessages([
    ["system", VALIDATOR_PROMPT],
    ["human", "{question}"]
]);

export const questionValidator = tool(
    async ({question}) => {
        const model = new ChatOpenAI({
            modelName: "gpt-4",
            temperature: 0
        });

        const chain = validationPrompt.pipe(model);
        const isQuestionLegal = await chain.invoke({question});

        let contentStr: string;
        if (Array.isArray(isQuestionLegal.content)) {
            contentStr = isQuestionLegal.content.map(part =>
                JSON.stringify(part)
            ).join(' ');
        } else {
            contentStr = isQuestionLegal.content;
        }
        return contentStr.toLowerCase().includes('yes') ? "yes" : "no";
    },
    {
        name: "validate_legal_question",
        description: "Validates if a question is about law and specifically about housing law in Brussels",
        schema: z.object({
            question: z.string().describe("The question to validate")
        })
    }
);

export const legalDocsRetriever = tool(
    async ({sourceName, sourceType, query}) => {
        const retriever = await new KnowledgeBase().retriever(sourceName, sourceType);
        const docs = await retriever.invoke(query);
        return JSON.stringify(docs);
    },
    {
        name: "belgian_law_search",
        description: "Search Belgian legal documents matching a legal question to provide a comprehensive legal answer",
        schema: z.object({
            sourceName: z.string().describe("The name of the legal source to search"),
            sourceType: z.string().describe("The type of legal document to search"),
            query: z.string().describe("The search query to match with legal sources")
        })
    }
)