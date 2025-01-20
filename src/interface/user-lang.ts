import {z} from "zod";

export const UserLangSchema = z.enum(["fr", "nl", "en"]);
// TypeScript type derived from the schema
export type UserLang = z.infer<typeof UserLangSchema>;