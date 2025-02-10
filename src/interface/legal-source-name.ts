import {z} from "zod";

/**
 * Used by the validation tool: SYSTEM_PROMPTS.sourceInference
 */
export const sources = [
    "unknown",
    "brussels-housing-code",
    "belgian-civil-code-general-provisions",
    "belgian-civil-code-inheritance-donations-wills",
    "belgian-civil-code-patrimonial-relations-and-couples",
    "belgian-civil-code-property",
    "belgian-civil-code-evidence",
    "belgian-civil-code-obligations",
    "belgian-civil-code-extra-contractual-liability",
    "belgian-penal-code",
    "prepwork-belgian-civil-code-extra-contractual-liability",
    "prepwork-belgian-civil-code-patrimonial-relations-couples-inheritance-donations-wills",
    "prepwork-belgian-civil-code-property",
    "prepwork-belgian-civil-code-obligations"
] as const;

export const codes = [
    "brussels-housing-code",
    "belgian-civil-code",
    "belgian-penal-code"
]

export const LegalSourceSchema = z.enum(sources);

export type LegalSource = z.infer<typeof LegalSourceSchema>;