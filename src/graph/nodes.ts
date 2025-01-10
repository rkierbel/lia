import {
    ConclusionOfLawAnnotation,
    LegalGraphIoAnnotation,
    LegalResearchAnnotation,
    PointOfLawAnnotation,
} from "./state.js";
import {Command, interrupt} from "@langchain/langgraph";
import {AIMessage} from "@langchain/core/messages";
import {legalDocsRetriever, questionValidator} from "./tools.js";
import {WELCOME_HUMAN} from "./prompts.js";


export const pointOfContact =
    async (state: typeof LegalGraphIoAnnotation.State) => {
        console.log("[PointOfContact] called");

        const messages = state.messages;

        if (messages.length === 0) {
            return new Command({
                update: {
                    messages: [new AIMessage({
                        content: WELCOME_HUMAN
                    })]
                },
                goto: 'pointOfContact'
            });
        }

        const lastMessage = messages[messages.length - 1];

        // Check if we have an answer from legalCommunicator
        // If yes, we're in task three - transmit the answer to user
        if (state.answer) {
            const response = new Command({
                update: {
                    messages: [new AIMessage({
                        content: state.answer
                    })],
                    answer: ""
                },
                goto: 'pointOfContact'
            });

            // Wait for next question after delivering answer
            await interrupt("Waiting for next question after delivering answer");
            return response;
        }

        const questionContent = Array.isArray(lastMessage.content)
            ? lastMessage.content.map(part =>
                typeof part === 'string' ? part : JSON.stringify(part)
            ).join(' ')
            : lastMessage.content;

        // Validate the question
        try {
            const validationResult = await questionValidator.invoke({
                question: questionContent
            });

            if (validationResult === "yes") {
                // Question is valid, proceed to legal classifier
                return new Command({
                    update: {
                        question: lastMessage.content,
                        messages: [new AIMessage({
                            content: "Thank you for your legal question. I'll help you find the relevant legal information."
                        })]
                    },
                    goto: 'legalClassifier'
                });
            } else {
                // Question is invalid, ask for another question
                const response = new Command({
                    update: {
                        messages: [new AIMessage({
                            content: "I apologize, but I can only help with questions about housing law in Brussels. Could you please ask a question related to that area of law?"
                        })]
                    },
                    goto: 'pointOfContact'
                });

                // Wait for another question after invalid question
                await interrupt("Waiting for new question after invalid input");
                return response;
            }
        } catch (error) {
            console.error('[PointOfContact] Error validating question:', error);
            const response = new Command({
                update: {
                    messages: [new AIMessage({
                        content: "I apologize, but I encountered an error processing your question. Could you please try asking again?"
                    })]
                },
                goto: 'pointOfContact'
            });

            // Wait for another question after error
            await interrupt("Waiting for new question after error");
            return response;
        }
    };

export const legalClassifier =
    async (state: typeof PointOfLawAnnotation.State) => {
        return;
    };

export const legalResearcher =
    async (state: typeof LegalResearchAnnotation.State) => {
        try {
            const {sourceName, sourceType, pointOfLaw, keywords} = state;

            const docs: string = JSON.stringify(await legalDocsRetriever.invoke({
                sourceName,
                sourceType,
                query: [pointOfLaw, keywords.join(', ')].join('; ')
            }));
            if (docs) console.log("[LegalResearcher] - successfully retrieved legal sources");
            return new Command({
                update: {
                    docs
                },
                goto: 'legalCommunicator'
            });
        } catch (error) {
            console.log("[LegalResearcher] - error", error);
            return new Command({
                update: {
                    answer: 'An error occurred during the retrieval of the legal sources.'
                },
                goto: 'pointOfContact'
            });
        }

    };

export const legalCommunicator =
    async (state: typeof ConclusionOfLawAnnotation.State) => {
        return;
    };




