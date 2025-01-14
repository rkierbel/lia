import {PointOfContactAnnotation} from '../state.js';
import {Command, interrupt, LangGraphRunnableConfig} from '@langchain/langgraph';

export const feedbackHandler = async (state: typeof PointOfContactAnnotation.State,
                                      config?: LangGraphRunnableConfig) => {
    if (!state.question) {
        console.log("[FeedbackHandler] - waiting for question in thread ", config?.configurable?.thread_id);
        interrupt("Waiting for user's question");
    } else {
        console.log("[FeedbackHandler] - question received: ", state.question);
        return new Command({
            goto: 'validationNode'
        })
    }
}