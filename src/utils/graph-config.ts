import {LangGraphRunnableConfig} from "@langchain/langgraph";


export const getThreadConfig =
    (threadId: string, recursionLimit = 100): LangGraphRunnableConfig => (
        {
            configurable: {thread_id: threadId},
            recursionLimit, // Default value of 100 unless overridden
        });