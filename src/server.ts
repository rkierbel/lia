import dotenv from "dotenv";
// api/server.ts
import express, {Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';
import {workflow} from "./graph/graph.js";
import {Command, GraphInterrupt} from "@langchain/langgraph";

dotenv.config({path: '../.env'});
const app = express();
app.use(express.json());

app.post('/api/conversation', async (req: Request, res: Response) => {
    const message = req?.body?.message;
    const threadId = req?.body?.threadId;
    console.log('Received message:', message);
    const config = {configurable: {thread_id: threadId || uuidv4()}, recursionLimit: 100};
    try {
        let result;
        if (!threadId) {
            result = await workflow.invoke({messages: []}, config);
        } else {
            console.log('Resuming conversation with thread ID & message ', config.configurable.thread_id, message);
            result = await workflow.stream(new Command({
                update: {
                    question: message
                },
                goto:'validationNode'
            }), config);
        }
        res.json({threadId: config.configurable.thread_id, messages: result});
    } catch (error) {
        if (error instanceof GraphInterrupt) {
            const currentState = await workflow.getState(config);
            res.json({
                threadId: config.configurable.thread_id,
                messages: currentState.values.messages,
                status: 'waiting_for_input'
            });
        } else {
            console.error('Error in conversation:', error);
            res.status(500).json({error: 'Failed to process conversation'});
        }
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});