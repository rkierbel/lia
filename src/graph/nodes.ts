import {
    ConclusionOfLawAnnotation,
    LegalGraphIoAnnotation,
    LegalResearchAnnotation,
    PointOfLawAnnotation,
} from "./state.js";
import {Command} from "@langchain/langgraph";
import {KnowledgeBase} from "../offline-rag-prep/knowledge-base.js";
import {tool} from "@langchain/core/tools";
import {z} from "zod";
import {ToolNode} from "@langchain/langgraph/prebuilt";
import {BaseRetriever} from "@langchain/core/retrievers";

const retrieval = tool(
    async ({sourceName, sourceType, query}) => {
        const retriever = await new KnowledgeBase().retriever(sourceName, sourceType);
        const docs = await retriever.invoke(query);
        return JSON.stringify(docs);
    },
    {
        name: "belgian_law_search",
        description: "Search Belgian legal documents matching a legal question to provide a comprehensive legal answer",
        schema: z.object({
            sourceName: z.string().describe("The name of the legal source to search"),
            sourceType: z.string().describe("The type of legal document to search"),
            query: z.string().describe("The search query to match with legal sources")
        })
    }
)

export const pointOfContact =
    async (state: typeof LegalGraphIoAnnotation.State) => {
        console.log("[PointOfContact] called");
        const messages = state.messages;
        if (!state.userLang) {
            throw new Error('User is required to provide is language to continue asking legal questions.');
        }
        const goto = 'legalClassifier';
        return new Command({
            update: {
                question: messages[messages.length - 1]
            },
            goto
        });
    };


export const legalClassifier =
    async (state: typeof PointOfLawAnnotation.State) => {
        return;
    };

export const legalResearcher =
    async (state: typeof LegalResearchAnnotation.State) => {
        try {
            const {sourceName, sourceType, pointOfLaw, keywords} = state;

            const docs: string = JSON.stringify(await retrieval.invoke({
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




