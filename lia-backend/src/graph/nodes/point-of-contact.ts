import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {writingChatModel} from '../ai-tool-factory.js';
import {InterruptReason} from '../../interface/interrupt-reason.js';

const model = writingChatModel();

export const pointOfContact =
    async (state: typeof PointOfContactAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[PointOfContact] called with thread: ", config?.configurable?.thread_id);

        const {messages, answer} = state;

        if (answer) {
            return await answerAndWaitForNewQuestion(state, config);
        }

        if (messages.length === 0) {
            return await welcomeUser(state, config);
        }
    };

async function answerAndWaitForNewQuestion(state: typeof PointOfContactAnnotation.State,
                                           config?: LangGraphRunnableConfig) {
    console.log("[PointOfContact] - answer provided by legalCommunicator: ", state.answer);
    const response = await model.invoke([
        {
            role: "system",
            content: `
            You are a legal assistant communicating a precise and detailed legal answer to a user.
            You communicate with the human user entirely in ${state.userLang}.
            The answer comes from verified legal sources. 
            Do not reformulate the content or alter the structure of the answer you are provided with: leave it unaltered.
            You may only translate the content of the answer, if the answer is provided in a language that is different from the following language: ${state.userLang}.
            In that case only, translate the answer to ${state.userLang}.
            Start your output with an empty line.
            After providing the answer, ask if they:
            1) Have another legal question
            2) Want to end the conversation
            Be concise but polite.
            `
        },
        {role: "human", content: `Communicate this legal answer: ${state.answer}; and ask for next steps. Do it in the following language: ${state.userLang}`}
    ], config);

    console.log("[PointOfContact] - communicates response to user: ", response);

    return new Command({
        update: {
            messages: messagesStateReducer(state.messages, [response]),
            answer: "",
            question: "",
            interruptReason: "waitNewQuestion" as InterruptReason
        },
        goto: "feedbackHandler"
    });
}

async function welcomeUser(state: typeof PointOfContactAnnotation.State,
                           config: LangGraphRunnableConfig) {
    console.log("[PointOfContact] - initial contact - welcome prompt");
    const response = await model.invoke([
        {
            role: "system",
            content: `
            You are a trilingual point of contact specialized in Belgian law. 
            Your mission is to ensure every user feels welcome regardless of their language preference.
            
            Communication Rules:
            1. Present a complete welcome message only in the following language: ${state.userLang}
            2. In your welcome message, include:
               - A warm, professional welcome to the legal assistance service
               - A clear statement of the legal domains covered: Housing law (or its translation), Family law (or its translation), Criminal law (or its translation)
               - An invitation to ask a legal question
            
            Format Requirements:
            - Ensure natural and organic, idiomatic expression in the following language: ${state.userLang}
            - Use formal but friendly tone appropriate to legal services
            `
        },
        {role: "human", content: `Start the conversation in ${state.userLang}`}
    ], config);
    console.log(response);
    return new Command({
        update: {
            messages: messagesStateReducer(state.messages, [response]),
            interruptReason: "waitNewQuestion" as InterruptReason
        },
        goto: 'feedbackHandler'
    });
}