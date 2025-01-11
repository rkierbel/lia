import {LegalClassifierAnnotation} from "../state.js";
import {Command} from "@langchain/langgraph";
import {tool} from "@langchain/core/tools";
import {LegalSource, LegalSourceSchema} from "../../interface/legal-document.js";
import {KnowledgeBase} from "../../offline-rag-prep/knowledge-base.js";
import {z} from "zod";

export const legalResearcher =
    async (state: typeof LegalClassifierAnnotation.State) => {
        try {
            const {sourceName, pointOfLaw, keywords} = state;
            if (sourceName === "unknown") {
                return new Command({
                    update: {
                        answer: 'Unable to process request - unknown legal source'
                    },
                    goto: 'pointOfContact'
                });
            }
            const docs: string = JSON.stringify(await legalDocsRetriever.invoke({
                sourceName,
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

const legalDocsRetriever = tool(
    async ({sourceName, query}: {
        sourceName: LegalSource,
        query: string
    }) => {
        if (sourceName === "unknown") {
            throw new Error("Cannot retrieve documents for unknown source");
        }
        const retriever = await new KnowledgeBase().retriever(sourceName);
        const docs = await retriever.invoke(query);
        return JSON.stringify(docs);
    },
    {
        name: "belgian_law_search",
        description: "Search Belgian legal documents matching a legal question to provide a comprehensive legal answer",
        schema: z.object({
            sourceName: LegalSourceSchema,
            query: z.string().describe("The search query to match with legal sources")
        })
    }
)