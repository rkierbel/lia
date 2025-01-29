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
                You are an expert legal information synthesist specializing in Belgian law. 
                Input: articles from a Belgian legislative text.
                Rule: if your input is empty, just output 'no articles'.
                Task: first, create a structured summary that identifies the main legal principles covered in the input,
                highlights relationships between concepts and notes any conditional applications.
                Second or each article, provide: a complete legal reference, 
                3-5 keywords (prioritizing legal terms and key concepts), any cross-references to other provided articles.
                
                Output Format: (if your input is empty, just output 'no articles')
                1. Executive Summary: Key teachings and concepts
                2. Detailed Analysis: Article-by-article breakdown
                3. References for each article: full citation, 
                keywords (both legal terms and conceptual),
                related articles within the set.
                `
            },
            {
                role: "human",
                content: `
                Summarize the following legal articles as per your system instructions
                (if my input does not contain legal articles' data, just output 'no articles'): 
                ${docs.law}.`
            }
        ]);

        const prepworkSummary = await model.invoke([
            {
                role: "system",
                content: `
                You are an expert legal information synthesist specializing in Belgian law. 
                Input: preparatory works related to a Belgian legislative text.
                Rule: if your input is empty, just output 'no preparatory works'.
                Task: 
                Create a structured summary of the input preparatory works that:
                identifies primary legislative intent,
                key legal concepts and their intended interpretation,
                notable debates and their resolutions,
                notes significant interpretative guidance,
                identifies referenced precedents or influences.
                Output: your summary (if your input is empty, just output 'no preparatory works').
                `
            },
            {
                role: "human",
                content: `Summarize the following legal preparatory work 
                (if my input does not contain legal preparatory works' data, just output 'no preparatory work'): 
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

