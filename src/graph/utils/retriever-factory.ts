import {tool} from "@langchain/core/tools";
import {LangGraphRunnableConfig} from "@langchain/langgraph";
import {Document} from "@langchain/core/documents";
import {z} from "zod";
import {CustomFilter} from "../../interface/custom-filter.js";
import {embeddingsModel, vectorStore} from "./ai-tools.js";
import {LegalSourceType, SourceTypeSchema} from "../../interface/legal-source-type.js";
import {LegalSource, LegalSourceSchema} from "../../interface/legal-source-name.js";

export const legalSourcesRetriever = tool(
    async (
        {question, sources}: { question: string, sources: LegalSource[] },
        config: LangGraphRunnableConfig
    ): Promise<Document[]> => {
        if (sources[0] === 'unknown') {
            throw new Error('Cannot retrieve documents for unknown source');
        }
        console.log(`[LegalSourceRetriever] - called for sources ${sources}`);
        const retriever = await createRetriever(
            legalSearchFilter(sources)
        );
        return await retriever.invoke(question, config);
    },
    {
        name: 'belgian_law_search',
        description: 'Search Belgian legal documents matching a legal question to provide a comprehensive legal answer',
        schema: z.object({
            question: z.string().describe('search query to match with legal sources'),
            sources: z.array(LegalSourceSchema)
        })
    }
);

export const cachedQuestionRetriever = tool( //TODO -> handle errors in flow
    async (
        {sourceType, question},
        config: LangGraphRunnableConfig): Promise<string> => {

        console.log(`[CachedQuestionRetriever] - called for source type ${sourceType} in thread ${config?.configurable?.threadId}`);
        const store = await vectorStore();
        const embeddedQuestion = await embeddingsModel().embedQuery(question);
        const searchResult = await store.similaritySearchVectorWithScore(
            embeddedQuestion, 10, cacheSearchFilter(sourceType));

        console.log(`[CachedQuestionRetriever] - found cached questions: ${searchResult}`);
        return searchResult
            .filter(([, score]) => score > 0.92)
            .toSorted(
                ([, score1], [, score2]): number => score2 - score1
            )[0][0].metadata.answerId;
    }, {
        name: 'belgian_law_cache_search',
        description: 'Retrieved cached answer by id',
        schema: z.object({
            sourceType: SourceTypeSchema.describe('search for either cached answers or questions'),
            question: z.string().describe('question to use for semantic search with cosine similarity score'),
        })
    }
);

export const cachedAnswerRetriever = tool(
    async (
        {sourceType, cachedQuestion, answerId},
        config: LangGraphRunnableConfig): Promise<string> => {

        console.log(`[LegalResearcher] - called cacheRetriever for source type ${sourceType}`);
        const retriever = await createRetriever(cacheSearchFilter(sourceType, answerId));
        const cachedAnswer = await retriever.invoke(cachedQuestion, config);

        return JSON.stringify(cachedAnswer[0].pageContent);
    }, {
        name: 'belgian_law_cache_search',
        description: 'Retrieved cached answer by id',
        schema: z.object({
            sourceType: SourceTypeSchema.describe('search for either cached answers or questions'),
            cachedQuestion: z.string().describe('cached question'),
            answerId: z.string().default('').describe('id of the cached answer to search for')
        })
    }
);

const createRetriever = async (filter: CustomFilter) => {
    const vs = await vectorStore();
    console.log(`[LegalResearcher - Retriever] - creating retriever with filter ${JSON.stringify(filter)}`);

    return vs.asRetriever({searchType: 'similarity'}, filter);
}

const legalSearchFilter = function (sources: LegalSource[] = []) {
    return {
        must: [
            {
                key: 'metadata.sourceName',
                match: {
                    any: sources
                }
            }
        ]
    };
}

const cacheSearchFilter = function (sourceType: LegalSourceType, answerId: string = '') {
    if (sourceType === 'cached-answer')
        return {
            must: [
                {
                    key: 'metadata.answerId',
                    match: {
                        value: answerId
                    }
                },
                {key: 'metadata.sourceType', match: {value: sourceType}}
            ]
        }
    else
        return {
            must: [{key: 'metadata.sourceType', match: {value: sourceType}}]
        }
}