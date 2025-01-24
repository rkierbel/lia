import {v4 as uuidv4} from 'uuid';
import {workflow} from "../graph/graph.js";
import {PregelOutputType} from "@langchain/langgraph/pregel";
import {IterableReadableStream} from "@langchain/core/utils/stream";
import {ConversationReq} from "../interface/conversation-req.js";
import {Command, LangGraphRunnableConfig, messagesStateReducer, StateSnapshot} from "@langchain/langgraph";
import {OverallStateAnnotation} from "../graph/state.js";
import {UserLang} from "../interface/user-lang.js";
import {ConversationError} from "../interface/app-error.js";

export class ConversationService {

    async getConversationStream(reqBody: ConversationReq):
        Promise<{ graphStream: IterableReadableStream<PregelOutputType>, threadId: string }> {

        const threadId = reqBody.threadId || uuidv4();
        const config = {
            configurable: {thread_id: threadId},
            recursionLimit: 100
        };

        let graphStream: IterableReadableStream<PregelOutputType>;

        if (reqBody.isNew) {
            graphStream = await this.startNewConversation(reqBody, config);
        } else {
            graphStream = await this.resumeConversation(reqBody, config);
        }

        return {graphStream, threadId};
    }

    private async startNewConversation(
        reqBody: ConversationReq,
        config: LangGraphRunnableConfig
    ): Promise<IterableReadableStream<PregelOutputType>> {
        if (!config?.configurable) throw new ConversationError('missing config');

        console.log('Starting new conversation with thread id: ', config.configurable.thread_id);
        return await workflow.stream({
            messages: [],
            userLang: (reqBody?.userLang as UserLang),
        }, {
            ...config,
            streamMode: "messages"
        });
    }

    private async resumeConversation(
        reqBody: ConversationReq,
        config: LangGraphRunnableConfig
    ): Promise<IterableReadableStream<PregelOutputType>> {
        if (!config?.configurable) throw new ConversationError('missing config');

        console.log('Resuming conversation with thread id: ', config.configurable.thread_id);

        const state: typeof OverallStateAnnotation.State =
            await workflow.getState(config).then((s: StateSnapshot) => s.values);

        return await workflow.stream(new Command({
            resume: "resuming after validation interrupt",
            update: {
                question: reqBody.message,
                interruptReason: "",
                messages: messagesStateReducer(state.messages, [reqBody.message as string])
            }
        }), {
            ...config,
            streamMode: "messages"
        });

    }
}