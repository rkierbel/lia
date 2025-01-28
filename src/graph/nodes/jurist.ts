import {LegalResearcherAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../utils/message-to-string.js';
import {juristChatModel} from "../utils/ai-tools.js";
import {cacheQuestionAnswer} from "../../qdrant/qdrant-adapter.js";


const model = juristChatModel();

export const jurist =
    async (state: typeof LegalResearcherAnnotation.State, config: LangGraphRunnableConfig) => {
        const {pointOfLaw, docs, messages} = state;
        console.log(`[jurist] received the following question: ${pointOfLaw} and sources: ${docs}`);

        const lawSummary = await model.invoke([
            {
                role: "system",
                content: `
                Summarize articles given to you as input.
                Output rules: keep the article reference to which you append keywords. 
                Provide a summary of the essence of the legal notions and concepts covered by the input articles.
                `
            },
            {
                role: "human",
                content: `Summarize the following legal articles (if no articles, just output 'no articles'): 
                ${docs.law}.`
            }
        ]);

        const prepworkSummary = await model.invoke([
            {
                role: "system",
                content: `
                Summarize the concepts, notions and most importantly intentions, covered and expressed in the input legal preparatory works.
                `
            },
            {
                role: "human",
                content: `Summarize the following legal preparatory work (if no content, just output 'no preparatory work'): 
                ${docs.prepwork}.`
            },
            lawSummary
        ])
        const response = await model.invoke([
            {
                role: "system",
                content: `
                 Task:
                 You will receive a question and documents.
                 You will answer the question using only these documents.
                 Your answer will be easily understandable by any human, concise yet precise.
                 Rules:
                 Do not use any other documents to answer the question, do not search the web to answer the question.
                 Under no circumstances can you use any other source than the input documents to answer the input question.
                 Stick strictly to the content of the input documents to answer the question.
                 Do not repeat yourself.
                 Define technical terms used to answer the question. 
                 Circular definitions are forbidden.
                 If some docs you use are contents of legal articles, include a clear and complete references to legal articles used to formulate specific points of your answer.
                 If some docs you are using are preparatory works (the doc's text contains 'prep work'), 
                 do not include an article reference, instead mention that the preparatory work for a given legal source is used.
                 Output:
                 First, write your answer in a maximum of 330 words.
                 Second, list the legal technical terms used associated with their clear and technically correct definitions.
                 Third, list the references (only of legal articles) that you used, including the legal source they belong to.
                 Output format:
                 Appealing to humans. If you use titles, keep them short and impactful.
                `
            },
            {
                role: "human",
                content: `Using the following context:${lawSummary.content} and ${prepworkSummary.content}; 
                to answer the following legal question: ${pointOfLaw}.`
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
                docs: {}
            },
            goto: 'pointOfContact'
        });
    };

