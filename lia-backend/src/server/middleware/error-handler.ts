import {NextFunction, Request, Response} from 'express';
import {ConversationError, ValidationError} from '../../interface/app-error.js';

const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
) => {
    if (error instanceof ValidationError) {
        res.status(error.statusCode).json({
            status: 'error',
            type: error.type,
            message: error.message,
            errors: error.errors,
            stack: process.env.NODE_ENV === 'development' ? error.stack : {}
        });
    }

    if (error instanceof ConversationError) {
        res.status(error.statusCode).json({
            status: 'error',
            type: error.type,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : {}
        });
    }

    // Handle unexpected errors
    console.error('Unexpected error:', error);
    res.status(500).json({
        status: 'error',
        type: 'UnexpectedError',
        message: 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : {}
    });
};

export default errorHandler;