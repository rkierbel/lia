import {v4 as uuidv4} from 'uuid';
import {aiTools} from "../graph/ai-tools/ai-tools-manager.js";

export const cacheQuestionAnswer = async function (question: string, answer: string) {
    const store = await aiTools.vectorStore();
    const answerId = uuidv4();
    console.log("[jurist] caching: ", question);

    await store.addDocuments([{
        id: answerId,
        pageContent: answer,
        metadata: {
            sourceType: 'cached-answer'
        }
    }]);
    await store.addDocuments([{
        id: uuidv4(),
        pageContent: question,
        metadata: {
            answerId: answerId,
            sourceType: 'cached-question'
        }
    }]);
}