import {PointOfContactAnnotation} from "../state.js";
import {Command, interrupt} from "@langchain/langgraph";
import {AIMessage} from "@langchain/core/messages";
import {WELCOME_HUMAN} from "../prompts.js";
import * as tools from "./point-of-contact-tools.js";

const askNewQuestionMessage = "I apologize, but I can only help with questions about Brussels housing law, family law, or criminal law. " +
    "Could you please rephrase your question to focus on one of these areas?";

export const pointOfContact =
    async (state: typeof PointOfContactAnnotation.State) => {
        console.log("[PointOfContact] called");

        const messages = state.messages;

        // Handles initial contact
        if (messages.length === 0) {
            console.log("[PointOfContact] - initial contact - welcome prompt");
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

        // Checks if we have an answer from legalCommunicator => transmits the answer to user
        if (state.answer) {
            console.log("[PointOfContact] - answer provided by legalCommunicator");
            const response = new Command({
                update: {
                    messages: [new AIMessage({
                        content: state.answer
                    })],
                    answer: ""
                },
                goto: 'pointOfContact'
            });

            // Waits for next question after delivering answer
            await interrupt("Waiting for next question after delivering answer");
            return response;
        }

        // Receives a new question
        const questionContent = Array.isArray(lastMessage.content) ?
            lastMessage.content.map(part =>
                typeof part === 'string' ? part : JSON.stringify(part)).join(' ')
            : lastMessage.content;

        try {
            console.log("[PointOfContact] - validating question");
            // First, validates the question is about a known area of law
            const validationResult = await tools.questionValidator.invoke({
                question: questionContent
            });

            if (validationResult !== "yes") {
                console.warn("[PointOfContact] - invalid legal question");
                // Question is invalid, ask for another question
                const response = new Command({
                    update: {
                        messages: [new AIMessage({content: askNewQuestionMessage})]
                    },
                    goto: 'pointOfContact'
                });
                await interrupt("Waiting for new question after invalid input");
                return response;
            }

            const sourceResult = await tools.legalSourceInference.invoke({question: questionContent});

            if (sourceResult === "unknown") {
                console.warn("[PointOfContact] - unknown legal source");
                const response = new Command({
                    update: {
                        messages: [new AIMessage({content: askNewQuestionMessage})]
                    },
                    goto: "pointOfContact"
                })
                await interrupt("Waiting for new question after unknown source");
                return response;
            }

            console.warn("[PointOfContact] - question sent to legalClassifier");
            return new Command({
                update: {
                    question: lastMessage.content,
                    sourceName: sourceResult,
                    messages: [new AIMessage({
                        content: "Thank you for your legal question. " +
                            "I'll help you find the relevant legal information."
                    })],
                },
                goto: 'legalClassifier'
            });

        } catch (error) {
            console.error('[PointOfContact] Processing error:', error);
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