import {Annotation, MessagesAnnotation} from "@langchain/langgraph";
import {UserLang} from "../interface/user-lang.js";
import {InterruptReason} from '../interface/interrupt-reason.js';
import {LegalSource} from "../interface/legal-source-name";
import {LegalSearchResult} from "../interface/legal-search-result";

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
    interruptReason: Annotation<InterruptReason>
});

export const LegalResearcherAnnotation = Annotation.Root({
    ...QualifierAnnotation.spec,
    docs: Annotation<LegalSearchResult>,
});

export const OverallStateAnnotation = Annotation.Root({
    ...PointOfContactAnnotation.spec,
    ...QualifierAnnotation.spec,
    ...LegalResearcherAnnotation.spec
})
