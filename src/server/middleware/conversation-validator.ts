import {NextFunction, Request, Response} from 'express';
import {ValidationError} from '../../interface/app-error.js';
import { body } from 'express-validator/lib/middlewares/validation-chain-builders.js';
import { ValidationChain } from 'express-validator/lib/chain/validation-chain.js';
import { validationResult } from 'express-validator/lib/validation-result.js';

export const conversationValidationRules: ValidationChain[] = [
    body('message')
        .if((value: string, {req}) => !req.body.isNew) // only required if not a new conversation
        .notEmpty()
        .custom((value: string) => {
            const validPattern = /^[a-zA-Z0-9éèàêç\s,.?!;\-':]+$/;
            if (!validPattern.test(value)) {
                throw new Error("Message can only contain letters, numbers, spaces and basic punctuation (,.?!'-;:)");
            }
            return true;
        }).trim()
        .withMessage('Message is required for ongoing conversations'),

    body('threadId')
        .optional()
        .isUUID()
        .withMessage('ThreadId must be a valid UUID'),

    body('isNew')
        .optional()
        .isBoolean()
        .withMessage('isNew must be a boolean'),

    body('userLang')
        .optional()
        .isLength({min: 2, max: 2})
        .isIn(['en', 'fr', 'nl'])
        .withMessage('userLang must be 2 characters long and any of fr, nl or en')
];

export const validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        console.log("----------------- calling request body validator ------------------");
        console.log(req);
        try {
            await Promise.all(validations.map(validation => validation.run(req)));

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(new ValidationError(errors.array().map(e => JSON.stringify(e))));
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};