export interface CodeContext {
    name: string,
    elements: CodeElement[]
}

export interface CodeElement {
    num: number,
    name: string,
    type: 'book' | 'title' | 'chapter' | 'section' | 'article'
}

export interface Book extends CodeElement {
    titles: Title[]
}

export interface Title extends CodeElement {
    chapters?: CodeElement[]
}

export interface Chapter extends CodeElement {
    sections?: CodeElement[]
}

export interface Section extends CodeElement {
    articles: CodeElement[]
}

