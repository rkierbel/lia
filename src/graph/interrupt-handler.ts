// graph/interrupt-handler.ts
import { Command, LangGraphRunnableConfig } from "@langchain/langgraph";
import {OverallStateAnnotation} from "./state.js";
import {workflow} from "./graph.js";

interface ThreadInfo {
    threadId: string;
    currentState: typeof OverallStateAnnotation.State;
}

interface InterruptData {
    message: string;
    threadInfo: ThreadInfo;
}

export class InterruptHandler {
    static async handleInterrupt(
        interruptData: InterruptData,
        config?: LangGraphRunnableConfig
    ) {
        const { threadInfo } = interruptData;
        const { threadId } = threadInfo;

        // Save the state at interrupt point
        const state = await workflow.getState({
            configurable: { thread_id: threadId }
        });

        return {
            state,
            threadId
        };
    }

    static async resumeFromInterrupt(
        threadId: string,
        userInput: string,
        config?: LangGraphRunnableConfig
    ) {
        // Create config with thread ID
        const graphConfig = {
            configurable: {
                thread_id: threadId,
                ...config?.configurable
            },
            ...config
        };

        // Resume the graph with the new command
        return await workflow.invoke(
            new Command({
                resume: userInput
            }),
            graphConfig
        );
    }
}