import {configureServer} from './server/server-config.js';
import {Request, Response} from 'express/';
import {ConversationController} from './server/conversation-controller.js';
import {conversationValidationRules, validate} from "./server/middleware/conversation-validator.js";
import {NextFunction} from "express";
import errorHandler from "./server/middleware/error-handler.js";

const { app, PORT } = configureServer();
const conversationController = new ConversationController();

app.post(
    '/api/conversation',
    validate(conversationValidationRules),
    (req: Request, res: Response, next: NextFunction): Promise<void> => conversationController.handleConversation(req, res, next)
);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


/*
TODO -> handle legal-pro vs citizen ?
TODO -> handle message content validation ?
TODO -> handle language inference if changes mid-chat ?
TODO -> handle double-texting
TODO -> handle network errors, handle end conversation,
TODO -> cache question & answer after legalCommunicator in parallel of answering
TODO -> Handle multiple sources
*/