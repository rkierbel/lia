import {Document} from "@langchain/core/documents";
import {LegalSource} from "./legal-source-name.js";

export interface CustomDocument extends Document {
    metadata: {
        sourceName: LegalSource,
        sourceType: string,
        elementRef: string
    }
}

export interface CachedQuestionDocument extends Document {
    metadata: {
        answerId: string
    }
}

export interface CachedAnswerDocument extends Document {
    metadata: {
        sourceType: string
    }
}