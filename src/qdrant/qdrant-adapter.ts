import {aiModelManager} from "../graph/utils/ai-model-manager.js";
import {v4 as uuidv4} from 'uuid';

export const cacheQuestionAnswer = async function (question: string, answer: string) {
    const store = await aiModelManager.vectorStore();
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