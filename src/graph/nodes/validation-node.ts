import {PointOfContactAnnotation} from '../state.js';
import {Command, interrupt, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {createChatModel} from '../ai-tool-factory.js';
import {languageDetector, legalSourceInference, questionValidator, toolNode} from './validation-tools.js';
import {AIMessageChunk, HumanMessage} from '@langchain/core/messages';

const model = createChatModel().bindTools(toolNode.tools);
type ValidationTempState = {
    userLang: string,
    llmResponse: AIMessageChunk
};

export const validationNode =
    async (state: typeof PointOfContactAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log('[ValidationNode] called');
        const {question} = state;
        const userLang = await languageDetector.invoke({question}, config);

        try {
            const [validationResult, sourceName] = await Promise.all([
                questionValidator.invoke({question}, config),
                legalSourceInference.invoke({question}, config)
            ]);

            if (validationResult !== 'yes') {
                const llmResponse = await model.invoke([
                    {
                        role: 'system',
                        content: `
                        You are a helpful legal assistant guiding a user.
                        You communicate with the user in ${userLang}.
                        The user has asked a question that is not about law or not within the areas we can help with.
                        Kindly explain the areas of law we can assist with: housing law, family law, and criminal law.
                        Encourage the user to rephrase their question or ask a question about a known law area.
                        Maintain a friendly and professional tone.
                        `
                    },
                    {role: 'human', content: question}
                ], config);

                return handleInterruptFlow(state, {userLang, llmResponse}, config);
            }

            if (sourceName === 'unknown') {
                const llmResponse = await model.invoke([
                    {
                        role: 'system',
                        content: `
                        You are a helpful legal assistant.
                        You communicate with the user in ${userLang}.
                        The user's question does not clearly relate to housing law, family law, or criminal law.
                        Provide clear guidance on the types of legal questions you can help with.
                        Encourage the user to rephrase or clarify their question.
                        Maintain a friendly and professional tone.
                        `
                    },
                    {role: 'human', content: question}
                ], config);

                return handleInterruptFlow(state, {userLang, llmResponse}, config);
            }

            // If all validations pass, confirm to user and proceed to legal classifier
            console.log('[ValidationNode] - question validated!', question, sourceName, userLang);
            const confirmationResponse = await model.invoke([
                {
                    role: 'system',
                    content: `
                    You are a legal assistant processing a user's legal question.
                    You communicate with the user in ${userLang}
                    Acknowledge that you understand the user's question and will help them.
                    Indicate that you will now analyze the question to provide the most relevant legal information.
                    Maintain a professional and reassuring tone.
                    `
                },
                {role: 'human', content: question}
            ], config);

            return new Command({
                update: {
                    messages: messagesStateReducer(state.messages, [confirmationResponse]),
                    question,
                    sourceName,
                    userLang
                },
                goto: 'legalClassifier'
            });

        } catch (error) {
            console.error('[ValidationNode] Processing error:', error);

            const llmResponse = await model.invoke([
                {
                    role: 'system',
                    content: `
                    You are a legal assistant handling an unexpected error.
                    You communicate with the user in ${userLang}.
                    Apologize for the inconvenience and reassure the user.
                    Invite them to try asking their question again.
                    Maintain a calm and professional tone.
                    `
                },
                {role: 'human', content: 'Error occurred'}
            ], config);

            return handleInterruptFlow(state, {userLang, llmResponse}, config);
        }
    };

const handleInterruptFlow =
    async (state: typeof PointOfContactAnnotation.State,
           tempState: ValidationTempState,
           config: LangGraphRunnableConfig) => {

        const messages = messagesStateReducer(state.messages, [tempState.llmResponse]);
        const interruptInput: string = await interrupt({
            message: 'Waiting for new question after invalid input',
            threadId: config?.configurable?.thread_id,
        });

        return new Command({
            update: {
                messages: messagesStateReducer(messages, [new HumanMessage(interruptInput)]),
                userLang: tempState.userLang
            },
            goto: 'validationNode'
        });
    };