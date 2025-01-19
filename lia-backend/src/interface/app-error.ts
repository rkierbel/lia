export type KnownError = 'AppError' | 'ValidationError' | 'ConversationError';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public override message: string,
        public type: KnownError = 'AppError'
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(public errors: string[]) {
        super(400, 'Validation Error', 'ValidationError');
        this.errors = errors;
    }
}

export class ConversationError extends AppError {
    constructor(message: string) {
        super(500, message, 'ConversationError');
    }
}