import dotenv from "dotenv";

import express, {Request, Response} from 'express';
import cors from 'cors';
import {workflow} from "./graph/graph.js";
import {Command, messagesStateReducer} from "@langchain/langgraph";
import {InterruptReason} from './interface/interrupt-reason.js';
import {PregelOutputType} from "@langchain/langgraph/pregel";
import {IterableReadableStream} from "@langchain/core/utils/stream";
import morgan from "morgan";
import {v4 as uuidv4} from 'uuid';
import {OverallStateAnnotation} from "./graph/state.js";

dotenv.config({path: '../.env'});
const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

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
    console.log(req?.body);
    const message = req?.body?.message;
    const threadId = req?.body?.threadId || uuidv4();
    const isNew = req?.body?.isNew;
    const config = {configurable: {thread_id: threadId}, recursionLimit: 100};
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (message) console.log('Received message: ', message);

    try {
        let graphStream: IterableReadableStream<PregelOutputType>;
        if (isNew) {
            console.log('Starting new conversation with thread id: ', threadId);
            graphStream = await workflow.stream({
                messages: [],
                userLang: req?.body?.userLang
            }, {
                ...config,
                streamMode: "messages"
            });
        } else {
            console.log('Resuming conversation with thread id: ', config.configurable.thread_id);
            const state: typeof OverallStateAnnotation.State = await workflow.getState(config).then(s => s.values);
            graphStream = await workflow.stream(new Command({
                resume: "resuming after interrupt",
                update: {
                    question: message,
                    interruptReason: "" as InterruptReason,
                    messages: messagesStateReducer(state.messages, [message])
                }
            }), {
                ...config,
                streamMode: "messages"
            });
        }
        for await (const chunk of graphStream) {
            if (chunk[1].langgraph_node !== 'pointOfContact' && chunk[1].langgraph_node !== 'validationNode') {
                continue;
            }
            if (chunk[1].tags.some((tag: string) => tag === 'noStream')) {
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