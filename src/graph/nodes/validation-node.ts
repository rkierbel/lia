import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {legalSourceInference, questionSpecifier, questionValidator} from './validation-tools.js';
import {BaseMessage, isHumanMessage} from '@langchain/core/messages';
import {InterruptReason} from '../../interface/interrupt-reason.js';
import {aiTools, ModelPurpose} from "../ai-tools/ai-tools-manager.js";

const analyticsModel = aiTools.createModel(ModelPurpose.ANALYTICS);

type ValidationTempState = {
    question?: string,
    messages: BaseMessage[],
    userLang: string,
    interruptReason?: InterruptReason
};

export const validationNode =
    async (state: typeof PointOfContactAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[ValidationNode] called");
        try {
            const questionSpecified: string = await questionSpecifier.invoke({
                question: state.question,
                humanMessages: state.messages.filter(m => isHumanMessage(m)).slice(-2).map(m => m.content as string)
            });
            const [validationResult, sources] = await Promise.all([
                questionValidator.invoke({question: questionSpecified}, config),
                legalSourceInference.invoke({question: questionSpecified}, config)
            ]);

            if (validationResult !== "yes" || sources[0] === "unknown") {
                const failureReason = validationResult !== "yes"
                    ? "is not related to law"
                    : "refers to unknown sources";

                console.log(`[ValidationNode] validation failure, question ${failureReason}`);

                const llmResponse = await analyticsModel.invoke([
                    {
                        role: "system",
                        content: `
                        You are a helpful legal assistant guiding a human user in Belgium.
                        Your output must use one language only: ${state.userLang}.
                        The human user has asked a question that ${failureReason}.
                        Kindly explain the areas of law we can assist with: housing law, civil law including family law, and criminal law.
                        Provide clear guidance on the types of legal questions you can help with:
                        housing law, civil law (Persons, Obligations, Property, Inheritance, Donations, Wills, Liability, Contracts, Couples, Patrimonial relations, Family), or criminal law.
                        Encourage the user to rephrase their question or ask a question about a known law area.
                        `
                    },
                    {
                        role: "human",
                        content: `Tell me in my own language (${state.userLang}) why my question is not valid, following the instructions of your system prompt: ${questionSpecified}`
                    }
                ], config);

                return toFeedbackHandler({
                    question: questionSpecified,
                    messages: messagesStateReducer(state.messages, [llmResponse]),
                    userLang: state.userLang,
                    interruptReason: "invalidQuestion" as InterruptReason
                });
            }

            // If all validations pass, confirm to user and proceed to qualifier
            console.log("[ValidationNode] - question validated!");
            const confirmationResponse = await analyticsModel.invoke([
                {
                    role: "system",
                    content: `
                    You are a helpful legal assistant conversing with a user in Belgium.
                    Your output must use one language only: ${state.userLang}.
                    Acknowledge that you understand the user's question; indicate that you will now analyze it and that you will provide an answer backed by trusted legal sources.
                    Keep your output simple and to the point. No need to greet the user.
                    `
                },
                {
                    role: "human",
                    content: "Acknowledge that you understand my question; indicate that you will now analyze it and that you will provide an answer backed by trusted legal sources."
                }
            ], {
                ...config,
                tags: ['breakAfter']
            });

            return new Command({
                update: {
                    messages: messagesStateReducer(state.messages, [confirmationResponse]),
                    question: questionSpecified,
                    sources
                },
                goto: "qualifier"
            });

        } catch (error) {
            console.error("[ValidationNode] Processing error:", error);

            const llmResponse = await analyticsModel.invoke([
                {
                    role: "system",
                    content: `
                    You are a legal assistant handling an unexpected error, guiding a user in Belgium.
                    Your output must use one language only: ${state.userLang}.
                    Apologize for the inconvenience and reassure the user.
                    Invite them to try asking their question again.
                    Maintain a calm and professional tone.
                    `
                },
                {role: "human", content: "Explain that an error occurred and invite me to ask another question."}
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