import {QualifierAnnotation} from '../state.js';
import {Command, LangGraphRunnableConfig, messagesStateReducer} from '@langchain/langgraph';
import {Document} from '@langchain/core/documents';
import {BaseMessage} from "@langchain/core/messages";
import {cachedAnswerRetriever, cachedQuestionRetriever, legalSourcesRetriever} from "../utils/retriever-factory.js";
import {LegalSourceType} from "../../interface/legal-source-type";


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
            const {sources, pointOfLaw} = state;

            if (process.env.SEMANTIC_CACHE_ENABLED === 'true') {
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

    const {pointOfLaw, messages} = state;
    const findSimilarQuestionsState: LegalResearcherTempState = {
        sourceType: 'cached-question', pointOfLaw, messages, config
    };
    const answerId = await findMostSimilarCachedQuestion(findSimilarQuestionsState);
    if (!answerId) {
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

    const findCachedAnswerState: LegalResearcherTempState = {
        sourceType: 'cached-answer', pointOfLaw, messages, config, answerId
    };
    return findCorrespondingCachedAnswer(findCachedAnswerState);
}

const findCorrespondingCachedAnswer = async function (
    findCachedAnswerState: LegalResearcherTempState) {

    const {sourceType, pointOfLaw, messages, config, answerId} = findCachedAnswerState;
    const cachedAnswer: string = await cachedAnswerRetriever.invoke({
        sourceType,
        cachedQuestion: pointOfLaw,
        id: answerId
    }, config);

    console.log(`[LegalResearcher] found cached answer: ${cachedAnswer}`);
    return new Command({
        update: {
            answer: cachedAnswer,
            messages: messagesStateReducer(messages, cachedAnswer),
            pointOfLaw: {},
            sources: [],
        },
        goto: 'pointOfContact'
    });
}

const findMostSimilarCachedQuestion = async function (
    findCachedAnswerState: LegalResearcherTempState): Promise<string> {

    const {sourceType, pointOfLaw, config} = findCachedAnswerState;
    return await cachedQuestionRetriever.invoke({
        sourceType,
        question: pointOfLaw
    }, config);
}

