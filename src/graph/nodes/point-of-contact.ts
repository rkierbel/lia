import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {InterruptReason} from '../../interface/interrupt-reason.js';
import {aiTools, ModelPurpose} from "../ai-tools/ai-tools-manager.js";

const analyticsModel = aiTools.createModel(ModelPurpose.ANALYTICS);

export const pointOfContact =
    async (state: typeof PointOfContactAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[PointOfContact] called with thread id: ", config?.configurable?.thread_id);

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
    console.log(`[PointOfContact] - answer provided by jurist: ${state.answer}`);

    const response = await analyticsModel.invoke([
        {
            role: "system",
            content: `
            Task: Belgium-Focused Legal Assistant: Deliver verbatim answers from verified sources in the following language: ${state.userLang}.
            Input: Legal answer content (structure/language: as provided);
            Output Rules:
            Your only target language of expression: ${state.userLang}.
            Always preserve the original answer's structure exactly.
            Translate only if the original answer is in a different language than ${state.userLang} (e.g., fr to nl).
            Final Interaction: after the answer, ask if the user would like to ask another legal question or end this conversation."
            `
        },
        {
            role: "human",
            content: `Communicate this legal answer: ${state.answer}; following your system instructions. Do it in the following language: ${state.userLang}`
        }
    ], config);

    console.log(`[PointOfContact] - communicates legal response: ${response.content}`);

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

    const response = await analyticsModel.invoke([
        {
            role: "system",
            content: `
            Task: Write one welcome message for legal assistance in ${state.userLang}.
            Your message includes: 
            a warm, professional greeting;
            an explicit list of covered domains: Housing Law, Civil Law (including Family Law), Criminal Law (use official translations of these terms in ${state.userLang});
            a clear invitation to ask a legal question.
            Rules: your message does not contain markdown, symbols (---, ***), or non-organic phrasing.
            Your tone is formal yet approachable (e.g., Belgian legal professional standards);
            Use natural idioms of ${state.userLang} (no literal translations).
            `
        },
        {role: "human", content: `Start the conversation in ${state.userLang}`}
    ], config);

    console.log(`[PointOfContact] welcomes user: ${response.content}`);

    return new Command({
        update: {
            messages: messagesStateReducer(state.messages, [response]),
            interruptReason: "waitNewQuestion" as InterruptReason
        },
        goto: 'feedbackHandler'
    });
}