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
                 You are able to summarize complex legal sources in order to extract meaningful legal notions and conclusions.
                 Your task is to formulate a conclusion of law in a clear yet precise and detailed language.
                 Your conclusion must be easily understandable by humans having no legal background.
                 The question is the following: ${pointOfLaw}
                 You base your answer solely on the following sources: ${docs}.
                 If you do not know the answer to the question that is asked, simply reply that you do not have the sufficient knowledge to provide a valid legal answer. 
                 Do not, under any circumstances, hallucinate.
                 You list the references to the sources used to formulate your answer, below your answer.
                 You output only your answer and the list of references. 
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