import {Annotation, MessagesAnnotation} from "@langchain/langgraph";
import {LegalSource} from "../interface/legal-document.js";
import {UserLang} from "../interface/user-lang.js";

export interface ConversationState {
    isEnding: boolean;
}

export const PointOfContactAnnotation  = Annotation.Root({
    ...MessagesAnnotation.spec,
    userLang: Annotation<UserLang>,
    question: Annotation<string>,
    sourceName: Annotation<LegalSource>,
    answer: Annotation<string>
});

export const LegalClassifierAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    pointOfLaw: Annotation<string>,
    sourceName: Annotation<LegalSource>
});

export const LegalResearcherAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    ...LegalClassifierAnnotation.spec,
    docs: Annotation<string>,
});

export const OverallStateAnnotation = Annotation.Root({
    ...PointOfContactAnnotation.spec,
    ...LegalClassifierAnnotation.spec,
    ...LegalResearcherAnnotation.spec
})
