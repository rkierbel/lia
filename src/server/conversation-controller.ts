import {NextFunction, Request, Response} from 'express';
import {ConversationService} from './conversation-service.js';
import {ConversationReq} from '../interface/conversation-req.js';
import {setResponseHeaders} from './server-config.js';
import {handleStream} from './stream-handler.js';
import {ConversationError} from "../interface/app-error.js";

export class ConversationController {

    private conversationService: ConversationService;

    constructor() {
        this.conversationService = new ConversationService();
    }

    // validation performed at this point, request safe to use
    async handleConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
        setResponseHeaders(res);
        console.log('[ConversationController] request received: ', req.body);
        const reqBody = req.body as ConversationReq;

        try {
            const {graphStream} =
                await this.conversationService.getConversationStream(reqBody);
            await handleStream(graphStream, res);
            res.end();
        } catch (error) {
            console.log(error);
            next(new ConversationError(error instanceof Error ? error.message : 'Failed to process conversation'));
        }
    }
}