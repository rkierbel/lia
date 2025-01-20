import {Document} from "@langchain/core/documents";
import {z} from "zod";

export const LegalSourceSchema = z.enum([
    "unknown",
    "brussels-housing-code",
    "belgian-civil-code-general-provisions",
    "belgian-civil-code-inheritance-donations-wills",
    "belgian-civil-code-patrimonial-relations-and-couples",
    "belgian-civil-code-property",
    "belgian-civil-code-evidence",
    "belgian-civil-code-obligations",
    "belgian-civil-code-extra-contractual-liability",
    "belgian-penal-code"]);
// TypeScript type derived from the schema
export type LegalSource = z.infer<typeof LegalSourceSchema>;

export interface LegalDocument extends Document {
    metadata: {
        sourceName: LegalSource,
        sourceType: string,
        elementRef: string
    }
}