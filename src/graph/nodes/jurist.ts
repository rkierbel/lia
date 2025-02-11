import {LegalResearcherAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../utils/message-to-string.js';
import {cacheQuestionAnswer} from "../../qdrant/qdrant-adapter.js";
import {aiTools, ModelPurpose} from "../ai-tools/ai-tools-manager.js";
import {codes} from "../../interface/legal-source-name.js";


const juristModel = aiTools.createModel(ModelPurpose.CREATIVE);

export const jurist =
    async (state: typeof LegalResearcherAnnotation.State, config: LangGraphRunnableConfig) => {
        const {pointOfLaw, docs, messages} = state;

        console.log(`[jurist] received the following question: ${pointOfLaw} 
        and sources: - law: ${docs?.law?.length} ; - prepwork: ${docs?.prepwork?.length}`);

        const lawSummary = await juristModel.invoke([
            {
                role: "system",
                content: `
                You are an expert at summarizing legal information, specializing in Belgian law. 
                Your input: articles from a Belgian legislative text.
                Rule: if your input is empty, just output 'no articles'.
                Your task: first, generate a detailed summary that identifies the main legal principles covered in the input,
                highlights relationships between concepts and notes any conditional applications.
                Second, for each article, provide a complete legal reference and 3 to 5 keywords (prioritizing legal terms and key concepts).
                Output: (if your input is empty, just output 'no articles')
                your detailed summary, followed by references for each article along with their related keywords.
                `
            },
            {
                role: "human",
                content: `
                Summarize the following legal articles as per your system instructions
                (if my input does not contain legal articles' data, just output 'no articles'): 
                ${docs.law}.`
            }
        ], config);

        console.log(`Output legal articles summaries: ${lawSummary.content}`);

        const prepWorkSummary = await juristModel.invoke([
            {
                role: "system",
                content: `
                You are an expert at summarizing legal information specializing in Belgian law. 
                Your input: preparatory works related to a Belgian legislative text.
                Rule: if your input is empty, just output 'no preparatory works'.
                Your task: generate a detailed summary of the input preparatory works that
                first, identifies primary legislative intent;
                second, highlights key legal concepts and their intended interpretation;
                third, singles out the most notable debates and their resolutions;
                fourth, notes significant interpretative guidance;
                finally, identifies referenced precedents or influences.
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
        ], config);

        console.log(`Output preparatory work summary: ${prepWorkSummary.content}`);

        const juristResponse = await juristModel.invoke([
            {
                role: "system",
                content: `
                You are an expert legal communicator and jurist answering a legal question using a predefined set of curated input sources.
                Your input: you will receive a legal question, a detailed summary of legal articles related to this question
                and a detailed summary of preparatory works related to these articles.
                Your task: answer the input question in an explanatory way using only your input.
                Rules: first rule, your answer is easily understandable by any human, concise yet precise.
                Second rule, do not use any other content or sources than those your received as your input to answer the legal question.
                Third rule, do not search the web to answer the question.
                Final rule, do not repeat yourself.
                Output: first, write your answer in a maximum of 400 words.
                Second, list the legal technical terms used associated with their clear and technically correct definitions.
                Circular definitions are forbidden.
                Third, list the references (only of legal articles) that you used, including the legal source they belong to.
                Use this limitative list of allowed sources' names: ${codes}. 
                Output format: appealing to humans, in markdown. If you use titles, keep them short and impactful.
                `
            },
            {
                role: "human",
                content: `
                Answer the following legal question: ${pointOfLaw}.
                Use only the following legal articles summary:${lawSummary.content} ;
                and the following preparatory works summary: ${prepWorkSummary.content}.
                `
            }
        ], config);

        console.log("[jurist] responded: " + (juristResponse?.content?.length ?? 0));

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

