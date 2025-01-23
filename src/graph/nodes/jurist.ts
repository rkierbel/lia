import {LegalResearcherAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../utils/message-to-string.js';
import {juristChatModel} from "../utils/ai-tool-factory.js";
import {cacheQuestionAnswer} from "../../qdrant/qdrant-adapter.js";


const model = juristChatModel();

export const jurist =
    async (state: typeof LegalResearcherAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[jurist] called, received the following question: ", state.pointOfLaw);
        const {pointOfLaw, docs, messages} = state;
        console.log(`[jurist] received sources: ${docs}`);
        const response = await model.invoke([
            {
                role: "system",
                content: `
                 Task:
                 You will receive a question and documents (the documents are legal articles).
                 You will answer the question using only these documents.
                 Your answer will be easily understandable by any human, concise yet precise.
                 Rules:
                 Do not use any other documents to answer the question, do not search the web to answer the question.
                 Under no circumstances can you use any other source than the input documents to answer the input question.
                 Stick strictly to the content of the input documents to answer the question.
                 Do not repeat yourself.
                 Define technical terms used to answer the question. 
                 Circular definitions are forbidden.
                 Use clear and complete references to legal articles used to formulate specific points of your answer.
                 Output:
                 First, write your answer in a maximum of 330 words.
                 Second, list the legal technical terms used associated with their clear and technically correct definitions.
                 Third, list the legal references (legal articles) that you used, including the legal source they belong to.
                 Output format:
                 Appealing to humans. If you use titles, keep them short and impactful.
                `
            },
            {
                role: "human",
                content: `Using the following documents:${docs}; Answer the following legal question: ${pointOfLaw}.`
            }
        ], config);

        console.log("[jurist] responded");

        if (process.env.SEMANTIC_CACHE_ENABLED === 'true') {
            await cacheQuestionAnswer(pointOfLaw, extractContent(response));
        }

        return new Command({
            update: {
                answer: extractContent(response),
                messages: messagesStateReducer(messages, [response]),
                pointOfLaw: {},
                sourceName: "",
                docs: ""
            },
            goto: 'pointOfContact'
        });
    };

