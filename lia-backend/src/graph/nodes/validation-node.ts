import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {writingChatModel} from '../utils/ai-tool-factory.js';
import {legalSourceInference, questionSpecifier, questionValidator} from './validation-tools.js';
import {BaseMessage, isHumanMessage} from '@langchain/core/messages';
import {InterruptReason} from '../../interface/interrupt-reason.js';

const model = writingChatModel();
type ValidationTempState = {
    question?: string,
    messages: BaseMessage[],
    userLang: string,
    interruptReason?: InterruptReason
};

export const validationNode =
    async (state: typeof PointOfContactAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("ValidationNode] called");
        try {
            const questionSpecified: string = await questionSpecifier.invoke({
                question: state.question,
                humanMessages: state.messages.filter(m => isHumanMessage(m)).slice(-2).map(m => m.content as string)
            });
            const [validationResult, sources] = await Promise.all([
                questionValidator.invoke({question: questionSpecified}, config),
                legalSourceInference.invoke({question: questionSpecified}, config)
            ]);

            if (validationResult !== "yes") {
                const llmResponse = await model.invoke([
                    {
                        role: "system",
                        content: `
                        You are a helpful and professional legal assistant guiding a user.
                        You communicate with the user in its language: ${state.userLang}.
                        The user has asked a question that is not about law or not within the areas we can help with.
                        Kindly explain the areas of law we can assist with: housing law, civil law including family law, and criminal law.
                        Encourage the user to rephrase their question or ask a question about a known law area.
                        `
                    },
                    {role: "human", content: questionSpecified}
                ], config);

                return toFeedbackHandler({
                    question: questionSpecified,
                    messages: messagesStateReducer(state.messages, [llmResponse]),
                    userLang: state.userLang,
                    interruptReason: "invalidQuestion" as InterruptReason
                });
            }

            if (sources[0] === "unknown") {
                const llmResponse = await model.invoke([
                    {
                        role: "system",
                        content: `
                        You are a helpful legal assistant.
                        You communicate with the user in its language: ${state.userLang}.
                        The user's question does not clearly relate to housing law, family law, or criminal law.
                        Provide clear guidance on the types of legal questions you can help with.
                        Encourage the user to rephrase or clarify their question.
                        Maintain a friendly and professional tone.
                        `
                    },
                    {role: "human", content: questionSpecified}
                ], config);

                return toFeedbackHandler({
                    question: questionSpecified,
                    messages: messagesStateReducer(state.messages, [llmResponse]),
                    userLang: state.userLang,
                    interruptReason: "invalidQuestion" as InterruptReason
                });
            }

            // If all validations pass, confirm to user and proceed to legal classifier
            console.log("[ValidationNode] - question validated!");
            const confirmationResponse = await model.invoke([
                {
                    role: "system",
                    content: `
                    You are a kind legal assistant.
                    Instructions:
                    You communicate with the user in its language: ${state.userLang}.
                    Your only task is to output three sentences:
                    1. to acknowledge that you understand the user's question
                    2. to indicate that you will now analyze it
                    3. to indicate that you will provide an answer backed by trusted legal sources
                    Keep your communication simple and to the point.
                    Output: the three sentences as described above, in the following language: ${state.userLang}. 
                    `
                }
            ], {...config, tags: ['breakAfter']});
            console.log(confirmationResponse);
            return new Command({
                update: {
                    messages: messagesStateReducer(state.messages, [confirmationResponse]),
                    question: questionSpecified,
                    sources
                },
                goto: "legalClassifier"
            });

        } catch (error) {
            console.error("[ValidationNode] Processing error:", error);

            const llmResponse = await model.invoke([
                {
                    role: "system",
                    content: `
                    You are a legal assistant handling an unexpected error.
                    You communicate with the user in ${state.userLang}.
                    Apologize for the inconvenience and reassure the user.
                    Invite them to try asking their question again.
                    Maintain a calm and professional tone.
                    `
                },
                {role: "human", content: "Error occurred"}
            ], config);

            return toFeedbackHandler({
                question: state.question,
                messages: messagesStateReducer(state.messages, [llmResponse]),
                userLang: state.userLang,
                interruptReason: "processingError" as InterruptReason
            });
        }
    };

function toFeedbackHandler(validationTempState: ValidationTempState) {
    return new Command({
        update: {
            question: validationTempState.question,
            messages: validationTempState.messages,
            userLang: validationTempState.userLang,
            interruptReason: validationTempState.interruptReason
        },
        goto: "feedbackHandler",
    });
}