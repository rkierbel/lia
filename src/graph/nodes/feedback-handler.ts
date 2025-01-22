import {PointOfContactAnnotation} from '../state.js';
import {Command, END, interrupt, LangGraphRunnableConfig} from '@langchain/langgraph';

export const feedbackHandler =
    async (
        state: typeof PointOfContactAnnotation.State,
        config: LangGraphRunnableConfig) => {

        const {interruptReason} = state;

        if (interruptReason === 'waitNewQuestion') {
            console.log('[FeedbackHandler] - waiting for new question in thread: ', config.configurable?.thread_id);
            interrupt('waitNewQuestion');
        } else if (interruptReason === 'invalidQuestion') {
            console.log('[FeedbackHandler] - invalid question received in thread: ', config.configurable?.thread_id);
            interrupt('invalidQuestion');
        } else if (interruptReason === 'checkSemanticCache') {
            console.log('[FeedbackHandler] - offering check semantic cache in thread: ', config.configurable?.thread_id);
            interrupt('checkSemanticCache');
        } else if (interruptReason === 'endGraph') {
            return new Command({goto: END});
        } else {
            return new Command({goto: 'validationNode'});
        }
    }