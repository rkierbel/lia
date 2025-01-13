import dotenv from "dotenv";
// api/server.ts
import express, {Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';
import {BaseMessage, HumanMessage} from '@langchain/core/messages';
import {workflow} from "./graph/graph.js";
import {InterruptHandler} from "./graph/interrupt-handler.js";

dotenv.config({path: '../.env'});
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
        console.log('[Conversation] Starting new conversation');
        const conversationId = uuidv4();
        const threadId = uuidv4();

        const config = {
            configurable: {
                thread_id: threadId
            },
            recursionLimit: 100
        };

        // Initialize empty conversation
        const result = await workflow.invoke({
            messages: []
        }, config);

        conversations.set(conversationId, {
            threadId,
            messages: result.messages
        });
        console.log('[Conversation] Created:', { conversationId, threadId });
        res.json({
            conversationId,
            messages: result.messages
        });

    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({error: 'Failed to start conversation'});
    }
});

app.post('/api/conversation/:conversationId/message', async (req: Request, res: Response): Promise<void> => {
    try {
        const {conversationId} = req.params;
        const {message} = req.body;
        const conversation = conversations.get(conversationId);
        const validation = validateConversationRequest(conversationId, message, conversation);

        if (validation.error || !conversation) {
            res.status(validation.status!).json({error: validation.error});
            return;
        }

        const config = {
            configurable: {thread_id: conversation.threadId},
            recursionLimit: 100,
        };
        const currentState = await workflow.getState(config);

        if (currentState.tasks.some(task => task.interrupts?.length > 0)) {
            const result = await InterruptHandler.resumeFromInterrupt(
                conversation.threadId,
                message,
                config
            );
            if (result.messages && result.messages.length > 0) {
                console.log("InterruptHandler result:", {result});
                // Only add new messages
                const newMessages = result.messages.slice(conversation.messages.length);
                conversation.messages.push(...newMessages);

                // Return only the latest message
                res.json({
                    messages: conversation.messages.map(msg => ({
                        role: msg.getType(),
                        content: msg.content
                    }))
                });
                console.log('INTERRUPT! Current conversation state:', {
                    id: conversationId,
                    threadId: conversation.threadId,
                    messageCount: conversation.messages.length
                });
                return;
            }
        }

        const newMessage = new HumanMessage(message);
        const currentMessages = [...conversation.messages, newMessage];

        console.log("Configuration passed to stream:", config);
        const stream = await workflow.stream({
            messages: currentMessages
        }, config);
        console.log("Initial messages in conversation:", conversation.messages);

        let hadUpdates = false;
        for await (const output of stream) {
            console.log("Stream output received:", output);
            const newMessages = output.messages.slice(conversation.messages.length);
            if (newMessages.length > 0) {
                conversation.messages.push(...newMessages);
                hadUpdates = true;
                // Track latest assistant message
            }
        }
        if (!hadUpdates) {
            console.warn('No new messages were generated during stream processing');
        }
        res.json({
            messages: conversation.messages.map(msg => ({
                role: msg.getType(),
                content: msg.content
            }))
        });

    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({error: 'Failed to process message'});
    }
});

function validateConversationRequest(conversationId: string, message: string, conversation?: Conversation): {
    error?: string,
    status?: number
} {
    if (!conversationId) {
        return {error: 'Invalid conversation ID', status: 400};
    }

    if (!message) {
        return {error: 'Invalid message', status: 400};
    }

    if (!conversation) {
        console.error(`[404] Conversation with ID ${conversationId} not found.`);
        return {error: 'Conversation not found', status: 404};
    }

    return {};
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});