import {END, MemorySaver, START, StateGraph} from "@langchain/langgraph";
import {OverallStateAnnotation} from "./state.js";
import {legalClassifier, legalCommunicator} from "./nodes.js";
import {pointOfContact} from "./nodes/point-of-contact.js";
import {legalResearcher} from "./nodes/legal-researcher.js";

export const graph = new StateGraph(OverallStateAnnotation)
    .addNode('pointOfContact', pointOfContact)
    .addNode('legalClassifier', legalClassifier)
    .addNode('legalResearcher', legalResearcher)
    .addNode('legalCommunicator', legalCommunicator)
    .addEdge(START, 'pointOfContact')
    .addEdge('pointOfContact', END)
    .compile({
        checkpointer: new MemorySaver()
    });

