import {PointOfContactAnnotation} from "../state.js";
import {Command, interrupt, LangGraphRunnableConfig} from "@langchain/langgraph";
import {createChatModel} from "../ai-tool-factory.js";
import {AIMessageChunk} from "@langchain/core/messages";

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

        return new Command({
            update: {
                messages
            },
            goto: 'validationNode'
        });
    };

async function answerAndWaitForNewQuestion(state: typeof PointOfContactAnnotation.State,
                                           config?: LangGraphRunnableConfig) {
    console.log("[PointOfContact] - answer provided by legalCommunicator");
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

    return handleUserInterrupt(state, response, config);
}

async function welcomeUser(state: typeof PointOfContactAnnotation.State,
                           config?: LangGraphRunnableConfig) {
    console.log("[PointOfContact] - initial contact - welcome prompt");
    const response = await model.invoke([
        {
            role: "system",
            content: `
            You are a multilingual legal assistant helping users with questions about Belgian law.
            Your goal is twofold:
            1) welcome the user in three languages: English, French and Dutch;
            2) encourage them to ask a legal question.
            Respond in a friendly, professional tone.
            Be sure to mention the areas of law you can help with: housing law, family law, and criminal law.
            Respond in the language of the user's interface.
        `
        },
        {role: "human", content: "Start the conversation"}
    ], config);

    // Save current state and interrupt for user input
    return handleUserInterrupt(state, response, config);
}

async function handleUserInterrupt(
    state: typeof PointOfContactAnnotation.State,
    response: AIMessageChunk,
    config?: LangGraphRunnableConfig
): Promise<Command> {
    const updatedMessages = [...state.messages, response];
    const interruptValue = await interrupt({
        message: "Waiting for user input",
        threadInfo: {
            threadId: config?.configurable?.thread_id,
            currentState: {
                ...state,
                messages: updatedMessages,
                answer: "",
            },
        },
    });

    // Create and return the Command object
    return new Command({
        update: {
            messages: updatedMessages,
            answer: "",
            question: interruptValue as string,
        },
        goto: "validationNode",
    });
}
