
/*
    context:
    -   law: book? + title + chapter? + section?
    -   jurisprudence: jurisdiction
*/
export interface LegalArticlePoint {
    id: string,
    vector: number[],
    payload: {
        partitionKey: string,
        source: 'law' | 'regulation' | 'jurisprudence' | 'doctrine',
        context: string
    }
}