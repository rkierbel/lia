import {LegalClassifierAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {tool} from '@langchain/core/tools';
import {LegalSource, LegalSourceSchema} from '../../interface/legal-document.js';
import {KnowledgeBase} from '../../offline-rag-prep/knowledge-base.js';
import {z} from 'zod';
import {Document} from '@langchain/core/documents';

export const legalResearcher =
    async (state: typeof LegalClassifierAnnotation.State, config: LangGraphRunnableConfig) => {
        try {
            const {sourceName, pointOfLaw} = state;
            const docs: string = await legalDocsRetriever.invoke({
                sourceName,
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
    async ({sourceName, query}: { sourceName: LegalSource, query: string },
           config: LangGraphRunnableConfig): Promise<string> => {
        if (sourceName === 'unknown') {
            throw new Error('Cannot retrieve documents for unknown source');
        }
        const retriever = await KnowledgeBase.instance.retriever(sourceName);
        const docs: Document[] = await retriever.invoke(query, config);
        return JSON.stringify(docs);
    },
    {
        name: 'belgian_law_search',
        description: 'Search Belgian legal documents matching a legal question to provide a comprehensive legal answer',
        schema: z.object({
            sourceName: LegalSourceSchema,
            query: z.string().describe('The search query to match with legal sources')
        })
    }
);