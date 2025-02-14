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

        const juristResponse = await juristModel.invoke([
            {
                role: "system",
                content: `
                You are an expert legal communicator and jurist answering a legal question using a predefined set of curated input sources.
                Your input: you will receive a legal question, legal articles and legal preparatory works for said articles.
                Your task: answer the input question in an explanatory way using only your input sources.
                The rules: 
                First rule, your answer must be easily understandable by any human while remaining technically accurate.
                Second rule, do not use any other content or sources than those your received as your input to answer the legal question.
                Third rule, do not search the web to answer the question.
                Final rule, do not repeat yourself.
                Your output: first, write your legal answer using an explanatory tone and a clear expression. 
                In the text of your answer, whenever you refer to a legal source as provided in your input, provide a citation indicating said source.
                Second, list the legal technical terms used associated with their clear and technically correct definitions.
                Circular definitions are forbidden.
                Use this limitative list of allowed sources' names: ${codes}. 
                The output format rules: the output should be appealing to humans, in markdown. If you use titles, keep them short and impactful.
                `
            },
            {
                role: "human",
                content: `
                Answer the following legal question: ${pointOfLaw}.
                Use only the following legal articles: ${docs.law} ;
                and the following preparatory works: ${docs.prepwork}.
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

