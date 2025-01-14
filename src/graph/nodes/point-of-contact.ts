import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {createChatModel} from '../ai-tool-factory.js';

const model = createChatModel();

export const pointOfContact =
    async (
        state: typeof PointOfContactAnnotation.State,
        config?: LangGraphRunnableConfig
    ) => {
        console.log("[PointOfContact] called with thread: ", config?.configurable?.thread_id);

        const {messages, answer} = state;

        // If we have an answer, transmit it and wait for new question
        if (answer) {
            return await answerAndWaitForNewQuestion(state, config);
        }

        // Handle initial contact
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
            answer: ""
        },
        goto: 'waitForQuestion'
    });
}

async function welcomeUser(state: typeof PointOfContactAnnotation.State,
                           config?: LangGraphRunnableConfig) {
    console.log("[PointOfContact] - initial contact - welcome prompt");
    const response = await model.invoke([
        {
            role: "system",
            content: `
            You are a multilingual legal assistant helping users with questions about Belgian law.
            1) welcome the user in three languages: English, French and Dutch;
            2) in three languages (English, French and Dutch) encourage them to ask a legal question;
            Respond in a friendly, professional tone.
            Be sure to mention the areas of law you can help with: housing law, family law, and criminal law.
        `
        },
        {role: "human", content: "Start the conversation"}
    ], config);
    console.log(response);
    return new Command({
        update: {
            messages: messagesStateReducer(state.messages, [response]),
        },
        goto: 'waitForQuestion'
    });
}