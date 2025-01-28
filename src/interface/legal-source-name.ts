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
    "belgian-penal-code",
    "prepwork-belgian-civil-code-extra-contractual-liability",
    "prepwork-belgian-civil-code-patrimonial-relations-couples-inheritance-donations-wills",
    "prepwork-belgian-civil-code-property",
    "prepwork-belgian-civil-code-obligations"]);

export type LegalSource = z.infer<typeof LegalSourceSchema>;