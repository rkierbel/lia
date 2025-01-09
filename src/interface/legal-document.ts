import {Document} from "@langchain/core/documents";

export type LegalSource = 'law' | 'regulation' | 'jurisprudence' | 'doctrine';

export interface LegalDocument extends Document {
    metadata: {
        sourceName: string,
        sourceType: LegalSource,
        elementRef: string
    }
}