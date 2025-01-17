import {LegalResearcherAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../../utils/message-to-string.js';
import {writingChatModel} from "../ai-tool-factory.js";

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
                 Input: 
                 You will receive a point of law and specific keywords, as well as a set of articles from the following legal source: ${state.sourceName.replace('-', ' ')}.
                 The point of law is the following: ${pointOfLaw}
                 You base your answer solely on the following sources: ${docs}.
                 Instructions:
                 Your task is to formulate an answer to the point of law in a clear yet precise and detailed expression, that thoroughly addresses the legal matters and issues you were given as input.
                 You base your answer solely on the sources you received as input.
                 Your answer must be formulated in a clear way, easily understandable by humans having no legal background.
                 If you refer to an article of a given legal source in your answer, you provide the full reference of this article.
                 The full reference of an article includes the name of the legal source it pertains to.
                 If you make use of a legal technical term, you will have to provide a clear and technically correct definition it. 
                 Pay a particular attention to the fact that the text of the definition of a term should not include the defined term itself. 
                 Example: you cannot define "Responsabilité pénale" like this: "La responsabilité pour un crime, pouvant entraîner des sanctions légales", because the text of the definition itself mentions the defined term: "responsabilité".
                 You can only use the data that were provided to you as part of your input to formulate your answer.
                 If the answer contains technical definitions, present them clearly.
                 If the answer contains legal references, present them clearly.
                 Output:
                 - First your clear, detailed answer, that thoroughly addresses the point of law you were given as input.
                 - Second the list of legal technical terms used associated with their clear and technically correct definitions.
                 - Third the list of legal references (articles) that you used, including the legal source they belong to.
                 Favor outputting your answer in a structured format that is appealing to humans.
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