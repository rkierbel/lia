import {Annotation, MessagesAnnotation} from "@langchain/langgraph";

export type lang = "en" | "fr" | "nl";


export const Messages = Annotation.Root({...MessagesAnnotation.spec});

export const LegalGraphIoAnnotation = Annotation.Root({
    question: Annotation<string>,
    legalMatter: Annotation<string>,
    answer: Annotation<string>,
    ...Messages.spec
});

// returned by the LegalClassifier to the LegalResearcher
export const PointOfLawAnnotation = Annotation.Root({
    pointOfLaw: Annotation<string>,
    keywords: Annotation<string[]>,
    sourceName: Annotation<string>,
    sourceType: Annotation<string>,
});

// returned by the LegalResearcher to the LegalCommunicator
export const LegalResearchAnnotation = Annotation.Root({
    ...PointOfLawAnnotation.spec,
    docs: Annotation<string>
});

// returned by the LegalCommunicator to the PointOfContact
export const ConclusionOfLawAnnotation = Annotation.Root({
    conclusion: Annotation<string>,
    references: Annotation<string[]>
});

export const OverallStateAnnotation = Annotation.Root({
    ...Messages.spec,
    ...LegalGraphIoAnnotation.spec,
    ...PointOfLawAnnotation.spec,
    ...LegalResearchAnnotation.spec,
    ...ConclusionOfLawAnnotation.spec
})
