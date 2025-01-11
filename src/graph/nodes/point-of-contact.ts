import {PointOfContactAnnotation} from "../state.js";
import {Command, interrupt, messagesStateReducer} from "@langchain/langgraph";
import {AIMessage, BaseMessage} from "@langchain/core/messages";
import * as tools from "./point-of-contact-tools.js";
import {ChatOpenAI} from "@langchain/openai";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {UserLang} from "../../interface/user-lang.js";
import {extractContent} from "../../utils/message-to-string.js";

export const pointOfContact =
    async (state: typeof PointOfContactAnnotation.State) => {
        console.log("[PointOfContact] called");

        const messages = state.messages;
        const lastMessage = messages[messages.length - 1];

        // If we have an answer from legalCommunicator, transmits the answer to user
        if (state.answer) return await answerAndWaitForNewQuestion(state.answer, state.userLang, messages);

        // Handles initial contact
        if (messages.length === 0) return await welcomeUser(messages);

        // Receives a new question
        const questionContent = extractContent(lastMessage);

        const questionLang: UserLang = await tools.languageDetector.invoke({text: questionContent});

        try {
            console.log("[PointOfContact] - validating question");

            // First, validates the question is about a known area of law
            const validationResult = await tools.questionValidator.invoke({question: questionContent});
            if (validationResult !== "yes") return await guideAfterInvalidQuestion(questionContent, questionLang, messages);

            // Validate the question relates to a known legal source
            const sourceResult = await tools.legalSourceInference.invoke({question: questionContent});
            if (sourceResult === "unknown") return await guideAfterUnknownSource(questionContent, questionLang, messages);

            const confirmationPrompt = ChatPromptTemplate.fromMessages([
                ["system",
                    `
                    You are a legal assistant processing a user's legal question.
                    You communicate with the user in ${questionLang}
                    Acknowledge that you understand the user's question and will help them.
                    Indicate that you will now analyze the question to provide the most relevant legal information.
                    Maintain a professional and reassuring tone.
                `],
                ["human", questionContent]
            ]);
            const model = new ChatOpenAI({
                model: "gpt-4o",
                temperature: 0
            });
            const confirmationChain = confirmationPrompt.pipe(model);
            const confirmationResponse = await confirmationChain.invoke({questionLang});
            console.log("[PointOfContact] - question sent to legalClassifier!", questionContent, sourceResult);

            return new Command({
                update: {
                    question: lastMessage.content,
                    sourceName: sourceResult,
                    messages: messagesStateReducer(messages, [new AIMessage(confirmationResponse)]),
                    userLang: questionLang
                },
                goto: 'legalClassifier'
            });

        } catch (error) {
            // A processing error occurred
            return await handleProcessingError(error, questionLang, messages);
        }
    };


async function answerAndWaitForNewQuestion(answer: string,
                                           questionLang: UserLang,
                                           messages: BaseMessage[]) {
    console.log("[PointOfContact] - answer provided by legalCommunicator");
    const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0
    });
    const answerPrompt = ChatPromptTemplate.fromMessages([
        ["system",
            `
            You are a legal assistant communicating a precise legal answer to a user.
            You communicate with the user in ${questionLang}.
            The answer comes from verified legal sources.
            Ensure the language and tone are clear, professional, and understandable.
            If not needed, do not reformulate the answer.
            If the answer contains legal references, present them clearly.
        `],
        ["human", `Communicate this legal answer: ${answer}`]
    ]);
    const answerChain = answerPrompt.pipe(model);
    const communicatedAnswer = await answerChain.invoke({questionLang, answer});

    const response = new Command({
        update: {
            messages: messagesStateReducer(messages, [new AIMessage(communicatedAnswer)]),
            answer: ""
        },
        goto: 'pointOfContact'
    });

    // Waits for next question after delivering answer
    await interrupt("Waiting for next question after delivering answer");
    return response;
}

async function welcomeUser(messages: BaseMessage[]) {
    console.log("[PointOfContact] - initial contact - welcome prompt");
    const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0
    });
    const welcomePrompt = ChatPromptTemplate.fromMessages([
        ["system",
            `
            You are a multilingual legal assistant helping users with questions about Belgian law.
            Your goal is twofold:
            1) welcome the user in three languages: English, French and Dutch;
            2) encourage them to ask a legal question.
            Respond in a friendly, professional tone.
            Be sure to mention the areas of law you can help with: housing law, family law, and criminal law.
            Respond in the language of the user's interface.
        `],
        ["human", "Start the conversation"]
    ]);
    const welcomeChain = welcomePrompt.pipe(model);
    const welcomeResponse = await welcomeChain.invoke({});

    return new Command({
        update: {
            messages: messagesStateReducer(messages, [new AIMessage(welcomeResponse)])
        },
        goto: 'pointOfContact'
    });
}

async function guideAfterInvalidQuestion(invalidQuestion: string,
                                         questionLang: UserLang,
                                         messages: BaseMessage[]) {
    console.warn("[PointOfContact] - invalid legal question");
    const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0
    });
    const invalidQuestionPrompt = ChatPromptTemplate.fromMessages([
        ["system",
            `
            You are a helpful legal assistant guiding a user.
            You communicate with the user in ${questionLang}.
            The user has asked a question that is not about law or not within the areas we can help with.
            Kindly explain the areas of law we can assist with: housing law, family law, and criminal law.
            Encourage the user to rephrase their question or ask a question about a known law area.
            Maintain a friendly and professional tone.
        `],
        ["human", invalidQuestion]
    ]);

    const invalidQuestionChain = invalidQuestionPrompt.pipe(model);
    const guidanceResponse = await invalidQuestionChain.invoke({});
    const response = new Command({
        update: {
            messages: messagesStateReducer(messages, [new AIMessage(guidanceResponse)])
        },
        goto: 'pointOfContact'
    });

    await interrupt("Waiting for new question after invalid input");
    return response;
}

async function guideAfterUnknownSource(invalidQuestion: string,
                                       questionLang: UserLang,
                                       messages: BaseMessage[]) {
    console.warn("[PointOfContact] - unknown legal source");
    const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0
    });
    const unknownSourcePrompt = ChatPromptTemplate.fromMessages([
        ["system",
            `
            You are a helpful legal assistant.
            You communicate with the user in ${questionLang}.
            The user's question does not clearly relate to housing law, family law, or criminal law.
            Provide clear guidance on the types of legal questions you can help with.
            Encourage the user to rephrase or clarify their question.
            Maintain a friendly and professional tone.
        `],
        ["human", invalidQuestion]
    ]);

    const unknownSourceChain = unknownSourcePrompt.pipe(model);
    const sourceGuidanceResponse = await unknownSourceChain.invoke({});
    const response = new Command({
        update: {
            messages: messagesStateReducer(messages, [new AIMessage(sourceGuidanceResponse)])
        },
        goto: "pointOfContact"
    })
    await interrupt("Waiting for new question after unknown source");
    return response;
}

async function handleProcessingError(error: unknown,
                                     questionLang: UserLang,
                                     messages: BaseMessage[]) {
    console.error('[PointOfContact] Processing error:', error);
    const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0
    });
    const errorPrompt = ChatPromptTemplate.fromMessages([
        ["system",
            `
            You are a legal assistant handling an unexpected error.
            You communicate with the user in ${questionLang}.
            Apologize for the inconvenience and reassure the user.
            Invite them to try asking their question again.
            Maintain a calm and professional tone.
        `],
        ["human", "Error occurred"]
    ]);

    const errorChain = errorPrompt.pipe(model);
    const errorResponse = await errorChain.invoke({});
    const response = new Command({
        update: {
            messages: messagesStateReducer(messages, [new AIMessage(errorResponse)])
        },
        goto: 'pointOfContact'
    });

    // Wait for another question after error
    await interrupt("Waiting for new question after error");
    return response;
}