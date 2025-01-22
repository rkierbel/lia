import {END, MemorySaver, START, StateGraph} from '@langchain/langgraph';
import {OverallStateAnnotation} from './state.js';
import {pointOfContact} from './nodes/point-of-contact.js';
import {legalResearcher} from './nodes/legal-researcher.js';
import {qualifier} from './nodes/legal-qualifier.js';
import {jurist} from './nodes/legal-communicator.js';
import {validationNode} from './nodes/validation-node.js';
import {feedbackHandler} from './nodes/feedback-handler.js';

const checkpointer = new MemorySaver();

export const workflow = new StateGraph(OverallStateAnnotation)
    .addNode('pointOfContact', pointOfContact, {
        ends: ['feedbackHandler']
    })
    .addNode('feedbackHandler', feedbackHandler, {
        ends: ['validationNode', END]
    })
    .addNode('validationNode', validationNode, {
        ends: ['qualifier', 'feedbackHandler']
    })
    .addNode('qualifier', qualifier, {
        ends: ['legalResearcher']
    })
    .addNode('legalResearcher', legalResearcher, {
        ends: ['jurist', 'feedbackHandler', 'pointOfContact']
    })
    .addNode('jurist', jurist, {
        ends: ['pointOfContact']
    })
    .addEdge(START, 'pointOfContact')
    .compile({checkpointer});
