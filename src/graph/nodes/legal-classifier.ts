import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../../utils/message-to-string.js';
import {createChatModel} from '../ai-tool-factory.js';

const model = createChatModel();

export const legalClassifier =
    async (state: typeof PointOfContactAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[LegalClassifier] called");
        const {question, sourceName, messages} = state;

        const response = await model.invoke([
            {
                role: "system",
                content: `
                You are an expert legal classifier. 
                You are able to reformulate human questions relative to ${sourceName} into precise and technically correct points of law.
                You will reformulate the following human user's question into a precise yet concise legal question.
                Question: ${question}
                You will highlight and list three to five legal keywords related to the question that you have reformulated. +
                You will append these legal keywords after your reformulated question in the following format.
                -your reformulated question-. Legal keywords: -your legal keywords-.
                Your only output should be -your reformulated question-. Legal keywords: -your legal keywords-.
                `
            },
            {role: "human", content: "Generate a reformulated legal question followed by relevant legal keywords"}
        ], config);
        console.log("[LegalClassifier] responded with the following content: ", response);

        return new Command({
            update: {
                pointOfLaw: extractContent(response),
                messages: messagesStateReducer(messages, [response]),
            },
            goto: 'legalResearcher'
        });
    };