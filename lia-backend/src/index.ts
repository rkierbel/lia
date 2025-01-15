import dotenv from "dotenv";

import express, {Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';
import {workflow} from "./graph/graph.js";
import {Command} from "@langchain/langgraph";
import {InterruptReason} from './interface/interrupt-reason.js';
import {PregelOutputType} from "@langchain/langgraph/pregel";
import {IterableReadableStream} from "@langchain/core/utils/stream";
import morgan from "morgan";

dotenv.config({path: '../.env'});
const app = express();
app.use(express.json());
app.use(morgan('dev'));
const PORT = process.env.PORT || 3003;


/*
TODO -> handle language inference if changes mid-chat ?
TODO -> handle double-texting & handle interrupts at various nodes
TODO -> handle network errors, handle end conversation,
TODO -> cache question & answer after legalCommunicator in parallel of answering
TODO -> Handle multiple sources
TODO -> UI
*/

app.post('/api/conversation', async (req: Request, res: Response) => {
    const message = req?.body?.message;
    let threadId = req?.body?.threadId;
    const config = {configurable: {thread_id: threadId}, recursionLimit: 100};
    // TODO -> check if necessary
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    if (message) console.log('Received message: ', message);

    try {
        let state: IterableReadableStream<PregelOutputType>;
        if (!threadId) {
            threadId = uuidv4();
            config.configurable.thread_id = threadId;
            console.log('Starting new conversation with thread id: ', threadId);
            state = await workflow.stream({messages: []}, {
                ...config,
                streamMode: "messages"
            });
        } else {
            console.log('Resuming conversation with thread id: ', config.configurable.thread_id);
            state = await workflow.stream(new Command({
                resume: "resuming after interrupt",
                update: {
                    question: message,
                    interruptReason: "" as InterruptReason
                }
            }), {
                ...config,
                streamMode: "messages"
            });
        }
        res.write(JSON.stringify({threadId}));
        for await (const chunk of state) {
          if (chunk[1].langgraph_node !== 'pointOfContact') {
            continue;
          }
          res.write(chunk[0].content);
        }
        res.end();
    } catch (error) {
        console.error('Error in conversation:', error);
        res.status(500).json({error: 'Failed to process conversation'});
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});