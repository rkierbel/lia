import {Annotation} from "@langchain/langgraph";
import {LegalArticle} from "./interface/legal-article.js";

/*
define channels, pass uninstantiated Annotation function as the value
the typescript type of each channel is the first generic arg to Annotation => ensure Graph's type safety
 */

export const GraphIOAnnotation = Annotation.Root({
    question: Annotation<string>,
    answer: Annotation<string>
});

export const PointOfLawAnnotation = Annotation.Root({
    pointOfLaw: Annotation<string>
});

export const LegalArticlesAnnotation = Annotation.Root({
    matchingArticles: Annotation<LegalArticle[]>({
        reducer: (currentState, update): LegalArticle[] => currentState.concat(update),
        default: (): LegalArticle[] => []
    })
});

export const RawLegalSearchAnnotation = Annotation.Root({
    ...PointOfLawAnnotation.spec,
    ...LegalArticlesAnnotation.spec
});

export const RelevantLegalResearchAnnotation = Annotation.Root({

})

export const ConclusionOfLawAnnotation = Annotation.Root({
    conclusionOfLaw: Annotation<string>
});