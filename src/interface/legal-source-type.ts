import {z} from "zod";

export const SourceTypeSchema = z.enum(['law', 'jurisprudence', 'doctrine', 'cached-question', 'cached-answer']);
export type LegalSourceType = z.infer<typeof SourceTypeSchema>;