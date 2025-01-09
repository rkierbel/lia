export type LegalSource = 'law' | 'regulation' | 'jurisprudence' | 'doctrine';

export interface LegalArticlePoint {
    id: string,
    vector: number[],
    payload: {
        sourceName: string,
        sourceType: LegalSource,
        elementRef: string
    }
}