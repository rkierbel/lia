export type KnownError = 'AppError' | 'ValidationError' | 'ConversationError';

export class AppError extends Error {
    constructor(
        public status: number,
        public override message: string,
        public type: KnownError = 'AppError'
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ConversationValidationError extends AppError {
    constructor(public override message: string) {
        super(400, message, 'ValidationError');
    }
}

export class ConversationError extends AppError {
    constructor(public override message: string) {
        super(500, message, 'ConversationError');
    }
}