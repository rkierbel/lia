import {Document} from "@langchain/core/documents";
import {z} from "zod";

export const LegalSourceSchema = z.enum(["unknown", "brussels_housing_code", "family_code", "penal_code"]);
// TypeScript type derived from the schema
export type LegalSource = z.infer<typeof LegalSourceSchema>;

export interface LegalDocument extends Document {
    metadata: {
        sourceName: string,
        sourceType: LegalSource,
        elementRef: string
    }
}