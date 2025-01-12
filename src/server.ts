import dotenv from "dotenv";
dotenv.config({ path: '../.env'});

// api/server.ts
import express, {Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';
import {BaseMessage, HumanMessage} from '@langchain/core/messages';
import {workflow} from "./graph/graph.js";
import {InterruptHandler} from "./graph/interrupt-handler.js";


const app = express();
app.use(express.json());

interface Conversation {
    threadId: string;
    messages: BaseMessage[];
}

// In-memory store of active conversations
const conversations = new Map<string, Conversation>();

app.post('/api/conversation/start', async (
    req: Request,
    res: Response) => {
    try {
        const conversationId = uuidv4();
        const threadId = uuidv4();

        const config = {
            configurable: {
                thread_id: threadId
            },
            recursionLimit: 100
        };

        // Initialize empty conversation
        const stream = await workflow.stream(
            { messages: [] },
            config
        );

        const messages: BaseMessage[] = [];
        for await (const output of stream) {
            if (output.messages) {
                messages.push(...output.messages);
            }
        }

        conversations.set(conversationId, {
            threadId,
            messages
        });

        res.json({
            conversationId,
            messages: messages.map(msg => ({
                role: msg.getType(),
                content: msg.content
            }))
        });

    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({ error: 'Failed to start conversation' });
    }
});

app.post('/api/conversation/:conversationId/message', async (req: Request, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params;
        const { message } = req.body;

        if (!conversationId) {
            res.status(400).json({ error: 'Invalid conversation ID' });
            return;
        }

        if (!message || typeof message !== "string") {
            res.status(400).json({ error: 'Invalid message' });
            return;
        }

        const conversation = conversations.get(conversationId);
        if (!conversation) {
            console.error(`[404] Conversation with ID ${conversationId} not found.`);
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        const config = {
            configurable: { thread_id: conversation.threadId },
            recursionLimit: 100,
        };

        const currentState = await workflow.getState(config);

        if (currentState.tasks.some(task => task.interrupts?.length > 0)) {
            const result = await InterruptHandler.resumeFromInterrupt(
                conversation.threadId,
                message,
                config
            );
            conversation.messages.push(...(result.messages || []));

            res.json({
                messages: (result.messages || []).map(msg => ({
                    role: msg.getType(),
                    content: msg.content
                }))
            });
            return;
        }

        const stream = await workflow.stream({ messages: [new HumanMessage(message)] }, config);

        const messages: BaseMessage[] = [];
        try {
            for await (const output of stream) {
                if (output.messages) {
                    messages.push(...output.messages);
                    conversation.messages.push(...output.messages);
                }
            }
        } catch (streamError) {
            console.error("Error while streaming workflow updates:", streamError);
            res.status(500).json({ error: 'Stream processing error' });
            return;
        }

        res.json({
            messages: messages.map(msg => ({
                role: msg.getType(),
                content: msg.content
            }))
        });

    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});