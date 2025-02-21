import {ConversationError, ConversationValidationError} from '../../interface/app-error.js';
import {ErrorRequestHandler, NextFunction} from "express";

const errorHandler: ErrorRequestHandler = (
    error: Error,
    req,
    res,
    next: NextFunction,
) => {

    console.error('Executing error middleware for error: ', error);

    res.setHeader('Content-Type', 'application/json');

    // Handle known errors
    if (error instanceof ConversationValidationError || error instanceof ConversationError) {
        res.status(400).end();
    } else {
        res.status(500).end();
    }
};

export default errorHandler;