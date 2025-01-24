import {NextFunction, Request, Response} from 'express';
import {ConversationError, ValidationError} from '../../interface/app-error.js';

const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
) => {
    const headers = res.getHeaders();
    res.set(headers);
    console.error('Error details:', {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });

    if (error instanceof ValidationError) {
        // Only send status code to client
        console.error('Validation error details:', error.errors);
        res.status(error.statusCode).end();
    } else if (error instanceof ConversationError) {
        // Only send status code to client
        console.error('Conversation error:', error.message);
        res.status(error.statusCode).end();
    } else {
        console.error('Unexpected error:', error);
        res.status(500).end();
    }

};

export default errorHandler;