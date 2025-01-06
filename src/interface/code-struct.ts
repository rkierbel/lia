/*
if no Book, save Titles under a Book 0 { num:0, titles:...}
if a Title, a Chapter, a Section or an Article has no name, name = empty string

if a Title has no chapter, articles go under a Chapter with the following properties:
{
  name: '',
  num: 0,
  sections: [{
      num: 0,
      articles: [{articles go here}]
  }]
}
if a Chapter has no sections, articles go under a section with the following properties:
  {
  num: 1,
  sections: [{
      num: 0,
      articles: [{articles go here}]
  }]
}

partitionKey = CodeContext.name-book.num
articleId = CodeContext.name-book-title-chapter-section-number
*/

export interface CodeContext {
    name: string,
    book: Book
}

export interface Book {
    num: number,
    titles: Title[]
}

export interface Title {
    num: number,
    chapters: Chapter[]
}

export interface Chapter {
    num: number,
    sections: Section[]
}

export interface Section {
    num: number,
    articles: Article
}

export interface Article {
    num: number
}

