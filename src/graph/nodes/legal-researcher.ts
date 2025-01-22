import {QualifierAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {tool} from '@langchain/core/tools';
import {
    CachedQuestionDto,
    LegalSource,
    LegalSourceSchema,
    LegalSourceType,
    SourceTypeSchema
} from '../../interface/custom-document.js';
import {z} from 'zod';
import {Document} from '@langchain/core/documents';
import {QdrantFilter} from "@langchain/qdrant";
import {vectorStore} from "../utils/ai-tool-factory.js";
import {InterruptReason} from "../../interface/interrupt-reason";

//TODO -> interrupt for semantic caching check if feature enabled and no check yet performed.
//TODO -> user has chosen a cached question -> get the answer, go to point of contact
//TODO -> user has not chosen a cached question -> retrieve sources, go to jurist
export const legalResearcher =
    async (state: typeof QualifierAnnotation.State, config: LangGraphRunnableConfig) => {
        try {
            const {sources, pointOfLaw} = state;
            if (process.env.SEMANTIC_CACHE_ENABLED === 'true') {
                console.log("[LegalResearcher] checking semantic cache for similar questions");
                return await handleSemanticCacheRetrieval(state, config);
            }

            const docs: Document[] = await legalSourcesRetriever.invoke({
                sources,
                sourceType: 'law',
                query: pointOfLaw
            }, config);

            if (docs) console.log('[LegalResearcher] - successfully retrieved legal sources!', docs.length);

            return new Command({
                update: {
                    docs,
                    messages: messagesStateReducer(state.messages, JSON.stringify(docs.map(d => d.pageContent)))
                },
                goto: 'jurist'
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

async function handleSemanticCacheRetrieval(
    state: typeof QualifierAnnotation.State,
    config: LangGraphRunnableConfig
): Promise<Command | void> {

    const {sources, pointOfLaw, selectedCachedQuestion} = state;

    if (state.hasCheckedSemanticCache &&
        selectedCachedQuestion.content !== undefined && //TODO -> assign after interrupt
        selectedCachedQuestion.answerId !== undefined) {
        const cachedAnswer: string = await cacheRetriever.invoke({
            question: selectedCachedQuestion.content,
            answerId: selectedCachedQuestion.answerId
        }, config);

        return new Command({
            update: {
                answer: cachedAnswer,
                messages: messagesStateReducer(state.messages, cachedAnswer),
                cachedQuestions: [],
                pointOfLaw: {},
                sources: [],
            },
            goto: 'pointOfContact'
        })
    } else if (!state.hasCheckedSemanticCache) {
        const cachedQuestionsDocs: Document[] = await legalSourcesRetriever.invoke({
            sources,
            sourceType: 'cached-question',
            query: pointOfLaw
        }, config);
        const cachedQuestions: CachedQuestionDto[] = cachedQuestionsDocs.map(q => {
                return {
                    content: q.pageContent,
                    answerId: q.metadata.answerId
                }
            }
        );

        return new Command({
            update: {
                cachedQuestions: cachedQuestions,
                messages: messagesStateReducer(state.messages, JSON.stringify(cachedQuestions)),
                interruptReason: 'checkSemanticCache' as InterruptReason,
                hasCheckedSemanticCache: true
            },
            goto: "feedbackHandler",
        });
    } else return;
}

const legalSourcesRetriever = tool(
    async (
        {sources, sourceType, query}: { sources: LegalSource[], sourceType: LegalSourceType, query: string },
        config: LangGraphRunnableConfig
    ): Promise<Document[]> => {
        if (sources[0] === 'unknown') {
            throw new Error('Cannot retrieve documents for unknown source');
        }
        const retriever = await createRetriever(sources, sourceType);
        return await retriever.invoke(query, config);
    },
    {
        name: 'belgian_law_search',
        description: 'Search Belgian legal documents matching a legal question to provide a comprehensive legal answer',
        schema: z.object({
            sources: z.array(LegalSourceSchema),
            sourceType: SourceTypeSchema,
            query: z.string().describe('search query to match with legal sources')
        })
    }
);

const cacheRetriever = tool( //TODO -> handle errors in flow
    async (
        {question, answerId},
        config: LangGraphRunnableConfig): Promise<string> => {

        const retriever = await createRetriever([], 'cached-answer', answerId);
        const cachedAnswer = await retriever.invoke(question, config);

        return JSON.stringify(cachedAnswer[0].pageContent);
    }, {
        name: 'belgian_law_cache_search',
        description: 'Retrieved cached answer by id',
        schema: z.object({
            question: z.string().describe('cached question to use as query'),
            answerId: z.string().describe('id of the cached answer to search for')
        })
    }
);

const createRetriever = async (
    sources: LegalSource[] = [], sourceType: LegalSourceType, id: string | null = null) => {
    const vs = await vectorStore();

    if (id) {
        return vs.asRetriever({searchType: 'similarity'}, {
            must: {has_id: [id]}
        });
    } else {
        const filter: QdrantFilter = {
            must: [
                {
                    key: 'metadata.sourceName',
                    match: {
                        any: sources
                    }
                },
                {key: 'metadata.sourceType', match: {value: sourceType}}
            ]
        };
        return vs.asRetriever({searchType: 'similarity'}, filter);
    }
}