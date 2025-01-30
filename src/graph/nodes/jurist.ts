import {LegalResearcherAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../utils/message-to-string.js';
import {cacheQuestionAnswer} from "../../qdrant/qdrant-adapter.js";
import {juristOpenAiChatModel, dataAnalysisOpenAiChatModel} from "../utils/ai-tools.js";


const dataAnalysisModel = dataAnalysisOpenAiChatModel();
const juristModel = juristOpenAiChatModel();

export const jurist =
    async (state: typeof LegalResearcherAnnotation.State, config: LangGraphRunnableConfig) => {
        const {pointOfLaw, docs, messages} = state;
        console.log(`[jurist] received the following question: ${pointOfLaw} 
        and sources: ${docs?.law} ; ${docs?.prepwork}`);

        const lawSummary = await dataAnalysisModel.invoke([
            {
                role: "system",
                content: `
                You are an expert legal information synthesist specializing in Belgian law. 
                Input: articles from a Belgian legislative text.
                Rule: if your input is empty, just output 'no articles'.
                Task: first, create a summary that identifies the main legal principles covered in the input,
                highlights relationships between concepts and notes any conditional applications.
                Second, for each article, provide a complete legal reference and 
                3 to 5 keywords (prioritizing legal terms and key concepts).
                Output: (if your input is empty, just output 'no articles')
                your summary, followed by references for each article along with their related keywords.
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

        const prepworkSummary = await dataAnalysisModel.invoke([
            {
                role: "system",
                content: `
                You are an expert legal information synthesist specializing in Belgian law. 
                Input: preparatory works related to a Belgian legislative text.
                Rule: if your input is empty, just output 'no preparatory works'.
                Task: create a summary of the input preparatory works that:
                identifies primary legislative intent,
                highlights key legal concepts and their intended interpretation,
                singles out the most notable debates and their resolutions,
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

        console.log(`Output summaries:\nlaw: ${lawSummary.content};\nprep work: ${prepworkSummary.content}`);

        const juristResponse = await juristModel.invoke([
            {
                role: "system",
                content: `
                You are an expert jurist answering a legal question using a predefined set of curated input sources.
                Input: you will receive a legal question, a summary of legal articles related to this question
                and a summary of preparatory works related to these articles.
                Task: answer the question using only the input sources.
                Rules: your answer is easily understandable by any human, concise yet precise.
                Do not use any other content or sources than those your received as input to answer the legal question.
                Do not search the web to answer the question.
                Do not repeat yourself.
                Output: first, write your answer in a maximum of 330 words.
                Second, list the legal technical terms used associated with their clear and technically correct definitions.
                Circular definitions are forbidden.
                Third, list the references (only of legal articles) that you used, including the legal source they belong to.
                Output format: appealing to humans. If you use titles, keep them short and impactful.
                `
            },
            {
                role: "human",
                content: `
                Answer following legal question: ${pointOfLaw}.
                Use only the following legal articles' summary:${lawSummary.content} ;
                and the following preparatory works' summary: ${prepworkSummary.content}.
                `
            }
        ], config);

        console.log("[jurist] responded");

        if (process.env.SEMANTIC_CACHE_ENABLED === 'true') {
            await cacheQuestionAnswer(pointOfLaw, extractContent(juristResponse));
        }

        return new Command({
            update: {
                answer: extractContent(juristResponse),
                messages: messagesStateReducer(messages, [juristResponse]),
                pointOfLaw: {},
                sourceName: "",
                docs: {}
            },
            goto: 'pointOfContact'
        });
    };

