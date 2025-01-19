import {LegalResearcherAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../utils/message-to-string.js';
import {writingChatModel} from "../utils/ai-tool-factory.js";

const model = writingChatModel();

export const legalCommunicator =
    async (state: typeof LegalResearcherAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[LegalCommunicator] called, received the following question: ", state.pointOfLaw);
        const {pointOfLaw, docs, messages} = state;

        const response = await model.invoke([
            {
                role: "system",
                content: `
                 You are an expert multilingual legal communicator. 
                 You are able to summarize complex legal sources in order to extract the most meaningful legal notions and answers.
                 HARD LIMIT of emitted tokens is 1000, keep it in mind when you create your complete answer.
                 Input: 
                 You will receive a point of law and specific keywords, as well as a set of articles from the following legal source(s): 
                 ${state.sources.map(src => src.replace('-', ' ')).join(', ')}.
                 The point of law is the following: ${pointOfLaw}
                 You base your answer solely on the following sources: ${docs}.
                 Instructions:
                 Your task is to formulate an answer to the point of law in a clear, concise yet precise expression, easily understandable by humans having no legal background.
                 Your answer must address the legal matters and issues you were given as input.
                 The most important instruction: don't repeat yourself and base your answer solely on the data (legal sources) you received as input.
                 If you refer to an article of a given legal source in your answer, you provide the full reference of this article. You only have to provide that full reference once per article in your answer.
                 The full reference of an article includes the name of the legal source it pertains to. 
                 If you make use of a legal technical term, you will have to provide a clear and technically correct but concise definition it. 
                 Pay a particular attention to the fact that the text of the definition of a term should not include the defined term itself. 
                 Output (do not draw lines, even using dashes):
                 First, write your answer in a maximum of 330 words: clear, concise yet precise expression, easily understandable by humans having no legal background. You must strike the right balance between synthesis and thoroughness.
                 Second, list the legal technical terms used associated with their clear and technically correct definitions.
                 Third, list the legal references (articles) that you used, including the legal source they belong to.
                 Output your complete answer in a format that is appealing to humans. If you use titles, keep them short and impactful.
                `
            },
            {role: "human", content: `Generate a clear, meaningful and thorough answer based on the retrieved docs and the following point of law: ${pointOfLaw}`}
        ], config);

        console.log("[LegalCommunicator] responded");
        return new Command({
            update: {
                answer: extractContent(response),
                messages: messagesStateReducer(messages, [response]),
                question: "",
                pointOfLaw: "",
                sourceName: "",
                docs: ""
            },
            goto: 'pointOfContact'
        });
    };