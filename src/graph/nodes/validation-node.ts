import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {legalSourceInference, questionSpecifier, questionValidator} from './validation-tools.js';
import {BaseMessage, isHumanMessage} from '@langchain/core/messages';
import {InterruptReason} from '../../interface/interrupt-reason.js';
import {dataAnalysisOpenAiChatModel} from "../utils/ai-tools.js";

const llm = dataAnalysisOpenAiChatModel();
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
                console.log("[ValidationNode] validation failure - not a question related to law");
                const llmResponse = await llm.invoke([
                    {
                        role: "system",
                        content: `
                        You are a helpful legal assistant guiding a human user in Belgium.
                        Your output must use one language only: ${state.userLang}.
                        The human user has asked a question that is not about law or not within the areas we can help with.
                        Kindly explain the areas of law we can assist with: housing law, civil law including family law, and criminal law.
                        Encourage the user to rephrase their question or ask a question about a known law area.
                        `
                    },
                    {
                        role: "human",
                        content: `Tell me in my own language (${state.userLang}), why my question is not valid as per your system prompt: ${questionSpecified}`
                    }
                ], config);

                return toFeedbackHandler({
                    question: questionSpecified,
                    messages: messagesStateReducer(state.messages, [llmResponse]),
                    userLang: state.userLang,
                    interruptReason: "invalidQuestion" as InterruptReason
                });
            }

            if (sources[0] === "unknown") {
                console.log("[ValidationNode] validation failure - unknown sources");
                const llmResponse = await llm.invoke([
                    {
                        role: "system",
                        content: `
                        You are a helpful legal assistant replying to a user in Belgium.
                        Your output must use one language only: ${state.userLang}.
                        The user's question does not clearly relate to a legal source supported by our application.
                        Provide clear guidance on the types of legal questions you can help with:
                        housing law, civil law (Persons, Obligations, Property, Inheritance, Donations, Wills, Liability, Contracts, Couples, Patrimonial relations, Family), or criminal law.
                        Encourage the user to rephrase or clarify their question.
                        `
                    },
                    {role: "human", content: `Tell me in my own language (${state.userLang}), why my question is not valid as per your system prompt: ${questionSpecified}`}
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
            const confirmationResponse = await llm.invoke([
                {
                    role: "system",
                    content: `
                    You are a kind legal assistant conversing with a user in Belgium.
                    Your output must use one language only: ${state.userLang}.
                    Acknowledge that you understand the user's question; indicate that you will now analyze it and that you will provide an answer backed by trusted legal sources.
                    Keep your output simple and to the point.
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
                goto: "qualifier"
            });

        } catch (error) {
            console.error("[ValidationNode] Processing error:", error);

            const llmResponse = await llm.invoke([
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