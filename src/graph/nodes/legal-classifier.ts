import {PointOfContactAnnotation} from "../state.js";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {ChatOpenAI} from "@langchain/openai";
import {Command, messagesStateReducer} from "@langchain/langgraph";
import {extractContent} from "../../utils/message-to-string.js";

export const legalClassifier =
    async (state: typeof PointOfContactAnnotation.State) => {
        console.log("[LegalClassifier] called");
        const {question, sourceName, messages} = state;

        const classificationPrompt = ChatPromptTemplate.fromMessages([
            ["system",
                `
                 You are an expert legal classifier. 
                 You are able to reformulate human questions relative to ${sourceName} into precise and technically correct points of law.
                 You will reformulate the following human user's question into a precise yet concise legal question.
                 Question: ${question}
                 You will highlight and list three to five legal keywords related to the question that you have reformulated. +
                 You will append these legal keywords after your reformulated question in the following format.
                 -your reformulated question-. Legal keywords: -your legal keywords-.
                 Your only output should be -your reformulated question-. Legal keywords: -your legal keywords-.
            `]
        ]);
        const model = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0
        });
        const classificationChain = classificationPrompt.pipe(model);
        const classificationResponse = await classificationChain.invoke({sourceName, question});
        console.log("[LegalClassifier] responded with the following content: ", classificationResponse);

        return new Command({
            update: {
                pointOfLaw: extractContent(classificationResponse),
                messages: messagesStateReducer(messages, classificationResponse),
            },
            goto: 'legalCommunicator'
        });
    };