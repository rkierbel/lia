import {LegalResearcherAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../../utils/message-to-string.js';
import {createChatModel} from '../ai-tool-factory.js';

const model = createChatModel();

export const legalCommunicator =
    async (state: typeof LegalResearcherAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[LegalCommunicator] called, received the following question: ", state.pointOfLaw);
        const {pointOfLaw, docs, messages} = state;

        const response = await model.invoke([
            {
                role: "system",
                content: `
                 You are an expert legal communicator. 
                 You are able to summarize complex legal sources in order to extract the most meaningful legal notions and conclusions.
                 Input: 
                 You will receive a point of law and specific keywords, as well as a set of articles from the following legal source: ${state.sourceName.replace('-', ' ')}.
                 The point of law is the following: ${pointOfLaw}
                 You base your answer solely on the following sources: ${docs}.
                 Instructions:
                 Your task is to formulate a conclusion of law in a clear yet precise and detailed language, that thoroughly answers the point of law you were given as input.
                 You base your answer solely on the sources you received as input.
                 Your conclusion must be easily understandable by humans having no legal background.
                 If you refer to an article of a given legal source in your conclusion, you provide the full reference of this article, that includes the name of the legal source it pertains to.
                 If you make use of a legal technical term, you will have to provide a clear and technically correct definition it.
                 Do not, under any circumstances, hallucinate.
                 Output:
                 If you do not know the answer to the question that is asked, simply reply that you do not have the sufficient knowledge to provide a valid legal answer. 
                 Else:
                 - First your clear, detailed conclusion, that thoroughly answers the point of law you were given as input.
                 - Second the list of legal technical terms used associated with their clear and technically correct definitions.
                 - Third the list of legal references (articles) that you used, including the legal source they belong to.
                `
            },
            {role: "human", content: "Generate a conclusion of law based on the retrieved docs and the point of law"}
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