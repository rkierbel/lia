import {OverallStateAnnotation} from '../state.js';
import {Command, interrupt, LangGraphRunnableConfig} from '@langchain/langgraph';

export const feedbackHandler =
    async (
        state: typeof OverallStateAnnotation.State,
        config: LangGraphRunnableConfig) => {

        const {interruptReason} = state;

        if (interruptReason === 'waitNewQuestion') {
            console.log('[FeedbackHandler] - waiting for new question in thread: ', config.configurable?.thread_id);
            interrupt('waitNewQuestion');
        } else if (interruptReason === 'invalidQuestion') {
            console.log('[FeedbackHandler] - invalid question received in thread: ', config.configurable?.thread_id);
            interrupt('invalidQuestion');
        }

        return new Command({goto: 'validationNode'});

    }