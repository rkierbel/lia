
export interface LegalArticlePoint {
    id: string,
    vector: number[],
    payload: {
        partitionKey: string,
        code: string,
        book: string,
        title: string,
        chapter: string,
        section: string
    }
}