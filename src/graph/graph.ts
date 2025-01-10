import {MemorySaver, START, StateGraph} from "@langchain/langgraph";
import {ConclusionOfLawAnnotation, OverallStateAnnotation, PointOfLawAnnotation} from "./state.js";
import {legalClassifier, legalCommunicator, legalResearcher, pointOfContact} from "./nodes.js";

export const graph = new StateGraph(OverallStateAnnotation)
.addNode('pointOfContact', pointOfContact)
.addNode('legalClassifier', legalClassifier, {input: PointOfLawAnnotation})
.addNode('legalResearcher', (state) => legalResearcher(state))
.addNode('legalCommunicator', legalCommunicator, {input: ConclusionOfLawAnnotation})
.addEdge(START, 'pointOfContact')
.addEdge('pointOfContact', 'legalClassifier')
.addEdge('legalClassifier', 'legalResearcher')
.addEdge('legalResearcher', 'legalCommunicator')
.addEdge('legalCommunicator', 'pointOfContact')
.compile({
    checkpointer: new MemorySaver()
});





