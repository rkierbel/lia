import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../utils/message-to-string.js';
import {aiModelManager, toolProvider} from '../utils/ai-model-manager.js';

const llm = aiModelManager.analyticsModel(toolProvider);

export const qualifier =
    async (state: typeof PointOfContactAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[qualifier] called");
        const {question, userLang, sources, messages} = state;

        const response = await llm.invoke([
            {
                role: "system",
                content: `
                Input: Human question, in the following language: ${userLang}; and pre-linked legal sources: ${sources.map(src => src.replace('-', ' ')).join(', ')}.
                Task: Transform ambiguous, broad or generic law-related questions into technically precise points of law; then extract 3–10 keywords. 
                Prioritize terms that directly that are directly related to the question and match primary concepts in these sources: ${sources}.
                Rules: Use ${userLang} (same as input); Maintain original intent while adding legal specificity;
                Output Format: first the reformulated question, then the keywords. Nothing else.
                `
            },
            {
                role: "human",
                content: `Generate a reformulated legal question followed by relevant legal keywords. Original human question: ${question}`
            }
        ], config);
        console.log("[qualifier] responded");

        return new Command({
            update: {
                pointOfLaw: extractContent(response),
                messages: messagesStateReducer(messages, [response]),
            },
            goto: 'legalResearcher'
        });
    };