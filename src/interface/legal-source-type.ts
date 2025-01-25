import {z} from "zod";

export const SourceTypeSchema = z.enum(['law', 'preparatory-work', 'jurisprudence', 'doctrine', 'cached-question', 'cached-answer']);
export type LegalSourceType = z.infer<typeof SourceTypeSchema>;