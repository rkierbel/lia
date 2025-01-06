// if no Book, save Titles under a Book 0 { num:0, titles:...}
// if a Title, a Chapter, a Section or an Article has no name, name = empty string
/*
 if a Title has no chapter, articles go under a Chapter with the following properties:
  {
    name: '',
    num: 0,
    sections: [{
        name: '',
        num: 0,
        articles: [{articles go here}]
    }]
  }
  if a Chapter has no sections, articles go under a section with the following properties:
    {
    name: 'Des baux',
    num: 1,
    sections: [{
        name: '',
        num: 0,
        articles: [{articles go here}]
    }]
  }
 */
export interface Book {
    num: number,
    titles: Title[]
}

export interface Title {
    name: string,
    num: number,
    chapters: Chapter[]
}

export interface Chapter {
    name: string,
    num: number,
    sections: Section[]
}

export interface Section {
    name: string,
    num: number,
    articles: Article
}

export interface Article {
    name: string,
    num: number
}