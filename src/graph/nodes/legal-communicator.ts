import {LegalResearcherAnnotation} from "../state.js";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {ChatOpenAI} from "@langchain/openai";
import {Command, messagesStateReducer} from "@langchain/langgraph";
import {extractContent} from "../../utils/message-to-string.js";

export const legalCommunicator =
    async (state: typeof LegalResearcherAnnotation.State) => {
        console.log("[LegalClassifier] called");
        const {pointOfLaw, docs, messages} = state;

        const classificationPrompt = ChatPromptTemplate.fromMessages([
            ["system",
                `
                 You are an expert legal communicator. 
                 You are able to summarize complex legal sources in order to extract meaningful legal notions and conclusions.
                 Your task is to formulate a conclusion of law that in a clear yet precise and detailed language, that is easily understandable by humans having no legal background.
                 The question is the following: ${pointOfLaw}
                 You base your answer solely on the following sources: ${docs}.
                 If you do not know the answer to the question that is asked, simply reply that you do not have the sufficient knowledge to provide a valid legal answer. 
                 Do not, under any circumstances, hallucinate.
                 You list the references to the sources used to formulate your answer, below your answer.
                 The answer and the list of references are passed on to the PointOfContact that will transmit them the human user in the user's language. 
            `]
        ]);
        const model = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0
        });
        const conclusionChain = classificationPrompt.pipe(model);
        const conclusion = await conclusionChain.invoke({pointOfLaw, docs});
        return new Command({
            update: {
                answer: extractContent(conclusion),
                messages: messagesStateReducer(messages, conclusion),
                question: "",
                pointOfLaw: "",
                sourceName: "",
                docs: ""
            },
            goto: 'pointOfContact'
        });
};