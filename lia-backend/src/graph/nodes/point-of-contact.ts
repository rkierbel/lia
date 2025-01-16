import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {createChatModel} from '../ai-tool-factory.js';
import {InterruptReason} from '../../interface/interrupt-reason.js';

const model = createChatModel();

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
            You are a legal assistant communicating a precise legal answer to a user.
            You communicate with the user in ${state.userLang}.
            The answer comes from verified legal sources.
            Ensure the language and tone are clear, professional, and understandable.
            If not needed, do not reformulate the answer.
            If the answer contains legal references, present them clearly.
            After providing the answer, ask if they:
            1) Have another legal question
            2) Want to end the conversation
            Be concise but polite.
        `
        },
        {role: "human", content: `Communicate this legal answer: ${state.answer}; and ask for next steps`}
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

            Initial Communication Rules:
            1. Always, always present a complete welcome message in all three languages
            2. Group each language's content together (welcome + scope)
            3. Present languages in this order: English, French, Dutch
            4. Use clear visual separation between language groups
            
            For each language, you must include:
            1. A warm, professional welcome to the legal assistance service
            2. A clear statement of the legal domains covered:
               - Housing law (or its translation)
               - Family law (or its translation)
               - Criminal law (or its translation)
            3. An invitation to ask a question
            
            Format Requirements:
            - Keep each language block separate and complete
            - Use visual spacing between language blocks
            - Maintain consistent structure across all three versions
            - Ensure natural, idiomatic expression in each language
            - Use formal but friendly tone appropriate to legal services
            
            After this trilingual welcome, adapt to the user's chosen language for subsequent interactions.
            Critical: This complete trilingual greeting must be provided at the start of every conversation, without exception.
            `
        },
        {role: "human", content: "Start the conversation"}
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