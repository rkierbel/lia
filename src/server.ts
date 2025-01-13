import dotenv from "dotenv";
// api/server.ts
import express, {Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';
import {workflow} from "./graph/graph.js";
import {Command} from "@langchain/langgraph";

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
            result = await workflow.invoke(new Command({
                resume: "resuming after interrupt",
                update: {
                    question: message
                }
            }), config);
        }
        res.json({threadId: config.configurable.thread_id, messages: result});
    } catch (error) {
        console.error('Error in conversation:', error);
        res.status(500).json({error: 'Failed to process conversation'});

    }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});