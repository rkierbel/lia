import {QualifierAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {LegalSourceType,} from '../../interface/custom-document.js';
import {Document} from '@langchain/core/documents';
import {InterruptReason} from "../../interface/interrupt-reason.js";
import {BaseMessage} from "@langchain/core/messages";
import {cacheRetriever, legalSourcesRetriever} from "../utils/retriever-factory.js";
import {CachedQuestion} from "../../interface/cache.js";


type LegalResearcherTempState = {
    sourceType: LegalSourceType,
    pointOfLaw: string,
    messages: BaseMessage[],
    config: LangGraphRunnableConfig,
    answerId?: string,
}

export const legalResearcher =
    async (state: typeof QualifierAnnotation.State, config: LangGraphRunnableConfig) => {
        try {
            const {sources, pointOfLaw, cacheSearchApproved} = state;

            if (process.env.SEMANTIC_CACHE_ENABLED === 'true' &&
                (cacheSearchApproved || hasSelectedCacheQuestion(state.selectedCachedQuestion))) {
                console.log("[LegalResearcher] checking semantic cache for similar questions");
                return await handleSemanticCacheRetrieval(state, config);
            } else {

                const docs: Document[] = await legalSourcesRetriever.invoke({
                    sources,
                    question: pointOfLaw
                }, config);

                if (docs) console.log('[LegalResearcher] - successfully retrieved legal sources!', docs);

                return new Command({
                    update: {
                        docs: docs.map(d => d.pageContent).join("; "),
                        messages: messagesStateReducer(state.messages, JSON.stringify(docs.map(d => d.pageContent)))
                    },
                    goto: 'jurist'
                });
            }
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

    const {pointOfLaw, selectedCachedQuestion, messages} = state;
    const {answerId, content} = selectedCachedQuestion;

    const hasSelectedCachedQuestion = content !== undefined && answerId !== undefined;

    if (state.hasCheckedSemanticCache && hasSelectedCachedQuestion) {
        const findCachedAnswerState: LegalResearcherTempState = {
            sourceType: 'cached-answer', pointOfLaw, messages, config, answerId
        };
        return findCorrespondingCachedAnswer(findCachedAnswerState);

    } else if (!state.hasCheckedSemanticCache) {
        const findSimilarQuestionsState: LegalResearcherTempState = {
            sourceType: 'cached-question', pointOfLaw, messages, config
        };
        return findSimilarCachedQuestions(findSimilarQuestionsState);

    } else {
        console.log("[LegalResearcher] no cached data search performed");
        return new Command({
            update: {
                cacheSearchApproved: false,
                messages: messagesStateReducer(messages, JSON.stringify({"cacheSearchResult":"none"})),
                cachedQuestions: [],
            },
            goto: 'jurist'
        });
    }
}

const findCorrespondingCachedAnswer = async function (
    findCachedAnswerState: LegalResearcherTempState) {

    const {sourceType, pointOfLaw, messages, config, answerId} = findCachedAnswerState;
    const cachedAnswer: string = await cacheRetriever.invoke({
        sourceType,
        cachedQuestion: pointOfLaw,
        id: answerId
    }, config);

    console.log(`[LegalResearcher] found cached answer: ${cachedAnswer}`);
    return new Command({
        update: {
            cacheSearchApproved: false,
            answer: cachedAnswer,
            messages: messagesStateReducer(messages, cachedAnswer),
            cachedQuestions: [],
            pointOfLaw: {},
            sources: [],
        },
        goto: 'pointOfContact'
    })
}

const findSimilarCachedQuestions = async function (
    findCachedAnswerState: LegalResearcherTempState) {

    const {sourceType, pointOfLaw, messages, config} = findCachedAnswerState;

    const cachedQuestionsDocs: Document[] = await cacheRetriever.invoke({
        sourceType,
        cachedQuestion: pointOfLaw
    }, config);
    const cachedQuestions: CachedQuestion[] = cachedQuestionsDocs.map(q => {
            return {
                content: q.pageContent,
                answerId: q.metadata.answerId
            }
        }
    );

    console.log(`[LegalResearcher] found similar cached questions: ${cachedQuestions}`);
    return new Command({
        update: {
            cachedQuestions: cachedQuestions,
            cacheSearchApproved: false,
            messages: messagesStateReducer(messages, JSON.stringify(cachedQuestions)),
            interruptReason: 'checkCachedQuestions' as InterruptReason,
            hasCheckedSemanticCache: true
        },
        goto: "feedbackHandler"
    });
}

const hasSelectedCacheQuestion = function(selectedCacheQuestion: Partial<CachedQuestion>) {
     const {answerId, content} = selectedCacheQuestion;
     return content !== undefined && answerId !== undefined;
}

