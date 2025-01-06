export interface LegalArticle {
    content: Paragraph[];
    metadata: {
        book?: number,
        title: number,
        chapter: number,
        section?: number,
        articleNum: number,
        paragraph?: number,
        relevance: number
    }
}

export interface Paragraph {
    content: string,
    metadata: {
        id: number,
        article: number
    }
}

