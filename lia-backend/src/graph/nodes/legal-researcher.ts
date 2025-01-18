import {LegalClassifierAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {tool} from '@langchain/core/tools';
import {LegalSource, LegalSourceSchema} from '../../interface/legal-document.js';
import {z} from 'zod';
import {Document} from '@langchain/core/documents';
import {QdrantVectorStore} from "@langchain/qdrant";
import {embeddingsModel} from "../ai-tool-factory.js";

export const legalResearcher =
    async (state: typeof LegalClassifierAnnotation.State, config: LangGraphRunnableConfig) => {
        try {
            const {sources, pointOfLaw} = state;
            const docs: string = await legalDocsRetriever.invoke({
                sources,
                query: pointOfLaw
            }, config);

            if (docs) console.log('[LegalResearcher] - successfully retrieved legal sources!', docs.length);

            return new Command({
                update: {
                    docs,
                    messages: messagesStateReducer(state.messages, docs)
                },
                goto: 'legalCommunicator'
            });
        } catch (error) {
            console.log('[LegalResearcher] - error', error);

            return new Command({
                update: {
                    messages: messagesStateReducer(state.messages, [])
                },
                goto: 'pointOfContact'
            });
        }

    };

const legalDocsRetriever = tool(
    async ({sources, query}: { sources: LegalSource[], query: string },
           config: LangGraphRunnableConfig): Promise<string> => {
        if (sources[0] === 'unknown') {
            throw new Error('Cannot retrieve documents for unknown source');
        }
        const retriever = await createRetriever(sources);
        const docs: Document[] = await retriever.invoke(query, config);
        return JSON.stringify(docs);
    },
    {
        name: 'belgian_law_search',
        description: 'Search Belgian legal documents matching a legal question to provide a comprehensive legal answer',
        schema: z.object({
            sources: z.array(LegalSourceSchema),
            query: z.string().describe('The search query to match with legal sources')
        })
    }
);

const createRetriever = async (sources: LegalSource[]) => {
    const filter = {
        must: [
            {
                key: 'metadata.sourceName',
                match: {
                    any: sources
                }
            },
            {key: 'metadata.sourceType', match: {value: 'law'}},
        ]
    };
    return new QdrantVectorStore(embeddingsModel(), {
        url: process.env.DB_URL,
        collectionName: 'belgian_law'
    }).asRetriever({searchType: 'similarity'}, filter);
}