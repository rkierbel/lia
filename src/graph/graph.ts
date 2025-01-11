import {END, MemorySaver, START, StateGraph} from "@langchain/langgraph";
import {OverallStateAnnotation} from "./state.js";
import {pointOfContact} from "./nodes/point-of-contact.js";
import {legalResearcher} from "./nodes/legal-researcher.js";
import {legalClassifier} from "./nodes/legal-classifier.js";
import {legalCommunicator} from "./nodes/legal-communicator.js";

export const workflow = new StateGraph(OverallStateAnnotation)
    .addNode('pointOfContact', pointOfContact, {
        ends: ['legalClassifier', 'pointOfContact', END]
    })
    .addNode('legalClassifier', legalClassifier, {
        ends: ['legalResearcher']
    })
    .addNode('legalResearcher', legalResearcher, {
        ends: ['legalCommunicator']
    })
    .addNode('legalCommunicator', legalCommunicator, {
        ends: ['pointOfContact']
    })
    .addEdge(START, 'pointOfContact')
    .compile({
        checkpointer: new MemorySaver()
    });
