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
TODO -> handle language inference if changes mid-chat ?
TODO -> handle double-texting
TODO -> handle network errors, handle end conversation,
TODO -> cache question & answer after jurist in parallel of answering
TODO -> semantic caching with feature flag + ui reflection - implement after legal Qualification -> offer option to review response from other semantically similar qs
TODO -> implement tracing with LangSmith
TODO -> verify correct usage of MemorySaver
TODO -> export chat feature + end convo button
*/