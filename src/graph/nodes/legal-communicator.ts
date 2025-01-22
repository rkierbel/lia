import {LegalResearcherAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {extractContent} from '../utils/message-to-string.js';
import {writingChatModel} from "../utils/ai-tool-factory.js";

const model = writingChatModel();

export const jurist =
    async (state: typeof LegalResearcherAnnotation.State, config: LangGraphRunnableConfig) => {
        console.log("[jurist] called, received the following question: ", state.pointOfLaw);
        const {pointOfLaw, docs, messages} = state;

        const response = await model.invoke([
            {
                role: "system",
                content: `
                Role: Expert Legal Communicator: Summarize complex legal sources into clear explanations for non-experts. 
                Strict 1,000-token limit.
                Input:
                    Legal question: ${pointOfLaw};
                    Keywords;
                    Articles from these sources: ${state.sources.map(src => src.replace('-', ' ')).join(', ')};
                    Base answers only on provided materials: ${docs}.
                Task:
                    Answer (≤330 words):
                        Address all legal issues raised in the legal question;
                        Simplify concepts without losing precision;
                        Define technical terms on first use (it is forbidden to provide circular definitions);
                        Cite each article fully once (e.g., "Article 12 of [Source Name]").
                    Key Terms: Alphabetical list with concise definitions.
                    References: Full citations of used articles (number and source name).
                Rules:
                    Absolute requirements:
                        Zero repetition of content;
                        No external knowledge – only use provided docs and stick to the question;
                        Human-friendly formatting (clear headings, bullet points / numbered lists when relevant).
                `
            },
            {role: "human", content: `Generate a clear, meaningful and thorough answer based on the retrieved docs and the following point of law: ${pointOfLaw}`}
        ], config);

        console.log("[jurist] responded");
        return new Command({
            update: {
                answer: extractContent(response),
                messages: messagesStateReducer(messages, [response]),
                question: "",
                pointOfLaw: "",
                sourceName: "",
                docs: ""
            },
            goto: 'pointOfContact'
        });
    };