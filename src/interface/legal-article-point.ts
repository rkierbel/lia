export interface LegalArticlePoint {
    id: string,
    vector: number[],
    payload: {
        sourceName: string,
        sourceType: 'law' | 'regulation' | 'jurisprudence' | 'doctrine',
        context: string
    }
}