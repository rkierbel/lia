import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../utils/message-to-string.js';
import {writingChatModel} from '../ai-tool-factory.js';

const model = writingChatModel();

export const legalClassifier =
    async (state: typeof PointOfContactAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[LegalClassifier] called");
        const {question, userLang, sources, messages} = state;

        const response = await model.invoke([
            {
                role: "system",
                content: `
                You are a multilingual legal classifier tasked with reformulating a human question that relates closely or remotely to law, into a precise, reasonably detailed and technically correct point of law.
                Input:
                You will receive an implicit or explicit human question that relates directly or indirectly to a legal issue or query.
                The human's question is the following: ${question}
                It has already been inferred that the human's question relates to an area of law regulated by the following legal source(s):
                ${sources.map(src => src.replace('-', ' ')).join(', ')}.
                Instructions:
                Reformulate the human's question into a precise, reasonably detailed and technically correct point of law.
                Your reformulation must use the same language as the initial question, that is the language ${userLang}.
                You will highlight and list three to ten legal keywords or important notions related to the question that you have reformulated.
                Your reformulation and keywords will be used to perform a semantic search against a vector database containing the following legal source(s):
                ${sources.map(src => src.replace('-', ' ')).join(', ')}.
                Select the keywords carefully so that the semantic search using a vector databased is facilitated, and yields more precisely matching pieces of the above mentioned source of law.
                Output:
                You will append these legal keywords after your reformulated point of law in the following format: 
                point of law. legal keywords.
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