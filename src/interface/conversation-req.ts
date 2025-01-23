import {CachedQuestion} from "./cache.js";

export interface ConversationReq {
    message?: string;
    threadId?: string;
    isNew?: boolean;
    userLang?: string;
    selectedCacheQuestion: Partial<CachedQuestion>;
}