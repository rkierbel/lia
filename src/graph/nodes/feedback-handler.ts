import {PointOfContactAnnotation} from '../state.js';
import {Command, END, interrupt, LangGraphRunnableConfig} from '@langchain/langgraph';
import {InterruptReason} from '../../interface/interrupt-reason.js';

export const feedbackHandler = async (state: typeof PointOfContactAnnotation.State,
                                      config: LangGraphRunnableConfig) => {
    const {interruptReason} = state;

    if (interruptReason === 'waitNewQuestion') {
        console.log('[FeedbackHandler] - waiting for new question in thread: ', config.configurable?.thread_id);
        interrupt({
            interruptReason: 'waitNewQuestion' as InterruptReason
        });
    } else if (interruptReason === 'invalidQuestion') {
        console.log('[FeedbackHandler] - invalid question received in thread: ', config.configurable?.thread_id);
        interrupt({
            interruptReason: 'invalidQuestion' as InterruptReason
        });
    } else if (interruptReason === 'endGraph') {
        return new Command({goto: END});
    } else {
        return new Command({goto: 'validationNode'});
    }
}