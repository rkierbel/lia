import dotenv from "dotenv";
// api/server.ts
import express, {Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';
import {workflow} from "./graph/graph.js";
import {Command} from "@langchain/langgraph";
import {OverallStateAnnotation} from './graph/state.js';
import {InterruptReason} from './interface/interrupt-reason.js';

dotenv.config({path: '../.env'});
const app = express();
app.use(express.json());

/* TODO -> handle language inference if changes ?
TODO -> handle double-texting, handle interrupts at various nodes, handle network errors, handle end conversation,
 cache question & answer after legalCommunicator in parallel of answering
*/
app.post('/api/conversation', async (req: Request, res: Response) => {
    const message = req?.body?.message;
    const threadId = req?.body?.threadId;
    const config = {configurable: {thread_id: threadId || uuidv4()}, recursionLimit: 100};

    if (message) console.log('Received message: ', message);

    try {
        let state: typeof OverallStateAnnotation.State;
        if (!threadId) {
            console.log('Starting new conversation with thread id: ', threadId);
            state = await workflow.invoke({messages: []}, config);
        } else {
            console.log('Resuming conversation with thread id: ', config.configurable.thread_id);
            state = await workflow.invoke(new Command({
                resume: "resuming after interrupt",
                update: {
                    question: message,
                    interruptReason: "" as InterruptReason
                }
            }), config);
        }
        res.json({
            threadId: config.configurable.thread_id,
            messages: state.messages[state.messages.length-1]
        });
    } catch (error) {
        console.error('Error in conversation:', error);
        res.status(500).json({error: 'Failed to process conversation'});
    }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});