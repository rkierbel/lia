import {Annotation, MessagesAnnotation} from "@langchain/langgraph";
import {LegalSource} from "../interface/custom-document.js";
import {UserLang} from "../interface/user-lang.js";
import {InterruptReason} from '../interface/interrupt-reason.js';
import {CachedQuestion} from "../interface/cache.js";

export const PointOfContactAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    userLang: Annotation<UserLang>,
    question: Annotation<string>,
    sources: Annotation<LegalSource[]>,
    answer: Annotation<string>,
    interruptReason: Annotation<InterruptReason>
});

export const QualifierAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    pointOfLaw: Annotation<string>,
    sources: Annotation<LegalSource[]>,
    cacheSearchApproved: Annotation<boolean>,
    hasCheckedSemanticCache: Annotation<boolean>,
    cachedQuestions: Annotation<CachedQuestion[]>,
    selectedCachedQuestion: Annotation<{ content?: string, answerId?: string }>,
    interruptReason: Annotation<InterruptReason>
});

export const LegalResearcherAnnotation = Annotation.Root({
    ...QualifierAnnotation.spec,
    docs: Annotation<string>,
});

export const OverallStateAnnotation = Annotation.Root({
    ...PointOfContactAnnotation.spec,
    ...QualifierAnnotation.spec,
    ...LegalResearcherAnnotation.spec
})
