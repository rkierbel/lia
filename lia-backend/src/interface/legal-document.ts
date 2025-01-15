import {Document} from "@langchain/core/documents";
import {z} from "zod";

export const LegalSourceSchema = z.enum(["unknown", "brussels-housing-code", "belgian-family-code", "belgian-penal-code"]);
// TypeScript type derived from the schema
export type LegalSource = z.infer<typeof LegalSourceSchema>;

export interface LegalDocument extends Document {
    metadata: {
        sourceName: LegalSource,
        sourceType: string,
        elementRef: string
    }
}