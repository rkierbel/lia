import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {writingChatModel} from '../utils/ai-tool-factory.js';
import {InterruptReason} from '../../interface/interrupt-reason.js';

const creativeModel = writingChatModel();

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
    console.log("[PointOfContact] - answer provided by jurist: ", state.answer);
    const response = await creativeModel.invoke([
        {
            role: "system",
            content: `
            Role: Belgium-Focused Legal Assistant: Deliver verbatim answers from verified sources in the following language: ${state.userLang}.
            Input:
                Legal answer content (structure/language: as provided);
                Your only target language of expression: ${state.userLang}.
            Output Rules:
                Never use: ---, ***, ___;
                Always:
                    Preserve original answer structure exactly;
                    Translate only if original answer is in a different language than ${state.userLang} (e.g., FR to NL).
            Final Interaction:
                After the answer, ask:
                "Would you like to:
                    Ask another legal question
                    End this conversation?"
            `
        },
        {role: "human", content: `Communicate this legal answer: ${state.answer}; while following your system instructions. Do it in the following language: ${state.userLang}`}
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
    const response = await creativeModel.invoke([
        {
            role: "system",
            content: `
            Role: Trilingual Belgian Law Specialist: Deliver welcoming, language-tailored introductions for legal assistance.
            Task: Write one welcome message in ${state.userLang} that:
                Includes:
                    Warm, professional greeting (e.g., "Welcome to your trusted legal support service...");
                    Explicit list of covered domains:        
                        Housing Law,
                        Civil Law (including Family Law),
                        Criminal Law,
                    (Use official translations of these terms in ${state.userLang});
                    Clear invitation to ask a legal question;
                Avoids: Markdown, symbols (---, ***), or non-organic phrasing
            Style Rules:
                Tone: Formal yet approachable (e.g., Belgian legal professional standards);
                Language: Natural idioms of ${state.userLang} (no literal translations).
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