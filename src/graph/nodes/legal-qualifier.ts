import {PointOfContactAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../utils/message-to-string.js';
import {writingChatModel} from '../utils/ai-tool-factory.js';

const model = writingChatModel();

/*
TODO _> extra linebreak after enum value
"Invalid enum value. Expected 'unknown' | 'brussels-housing-code' | 'belgian-civil-code-general-provisions' | 'belgian-civil-code-inheritance-donations-wills' | 'belgian-civil-code-patrimonial-relations-and-couple
s' | 'belgian-civil-code-property' | 'belgian-civil-code-evidence' | 'belgian-civil-code-obligations' | 'belgian-civil-code-extra-contractual-liability' | 'belgian-penal-code',

received 'belgian-civil-code-extra-contractual-liability\n"

 */
export const qualifier =
    async (state: typeof PointOfContactAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[qualifier] called");
        const {question, userLang, sources, messages} = state;

        const response = await model.invoke([
            {
                role: "system",
                content: `
                Role: Multilingual Legal Qualifier: Transform ambiguous, broad or generic law-related questions into precise points of law.
                Input:
                    Human question, in the following language: ${userLang};
                    Pre-linked legal sources: ${sources.map(src => src.replace('-', ' ')).join(', ')}.
                Task:
                    Reformulate the question into a technically precise point of law:
                        Use ${userLang} (same as input);
                        Maintain original intent while adding legal specificity;
                        Example: "Is verbal abuse punishable?" → "Under [Source X], does verbal abuse constitute a criminal offense triggering liability?"
                    Extract 3–10 keywords:  
                        Prioritize terms that directly that are directly related to the question and match primary concepts in these sources: ${sources}.            
                Output Format:
                    [Reformulated point of law]. [Keyword 1, Keyword 2, ..., Keyword N].
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