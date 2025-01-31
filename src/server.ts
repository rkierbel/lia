import {configureServer, corsOptions} from './server/server-config.js';
import {Request, Response} from 'express/';
import {ConversationController} from './server/conversation-controller.js';
import {conversationValidationRules, validate} from "./server/middleware/conversation-validator.js";
import {NextFunction} from "express";
import errorHandler from "./server/middleware/error-handler.js";
import cors from "cors";

const {app, PORT} = configureServer();
const conversationController = new ConversationController();

app.options('/api/conversation', cors(corsOptions));
app.post(
    '/api/conversation',
    validate(conversationValidationRules),
    (req: Request, res: Response, next: NextFunction): Promise<void> => conversationController.handleConversation(req, res, next)
);
app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
    console.error('Server startup error:', error);
});


/*
TODO -> handle profiling: legal-pro vs citizen ?
TODO -> handle language changes
TODO -> handle double-texting
TODO -> handle network errors, handle end conversation,
TODO -> implement effective caching of Q&As (so far, retrieval of cached answers implemented)
TODO -> implement tracing with LangSmith
TODO -> verify correct usage of MemorySaver
TODO -> export chat feature + end convo button
*/