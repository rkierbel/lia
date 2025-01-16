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
                Input:
                You will receive an implicit or explicit human question that relates directly or indirectly to a legal issue or query.
                The human's question is the following: ${question}
                It has already been inferred that the human's question relates to an area of law regulated by the ${sourceName.replace('-', ' ')}.
                Instructions:
                Reformulate the human's question into a precise, reasonably detailed and technically correct point of law.
                You will highlight and list three to ten legal keywords or important notions related to the question that you have reformulated.
                Your reformulation and keywords will be used to perform a semantic search against a vector database containing the following source of law: ${sourceName.replace('-', ' ')}.
                Select the keywords carefully so that the semantic search using a vector databased is facilitated, and yields more precisely matching pieces of the above mentioned source of law.
                Output:
                You will append these legal keywords after your reformulated point of law in the following format: 
                -point of law-. -legal keywords-.
                Your only output should be -point of law-. -legal keywords-.
                `
            },
            {role: "human", content: "Generate a reformulated legal question followed by relevant legal keywords"}
        ], config);
        console.log("[LegalClassifier] responded");

        return new Command({
            update: {
                pointOfLaw: extractContent(response),
                messages: messagesStateReducer(messages, [response]),
            },
            goto: 'legalResearcher'
        });
    };