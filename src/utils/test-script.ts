import {MarkdownTextSplitter} from '../offline-rag-prep/markdown-text-splitter.js';


new MarkdownTextSplitter().splitMarkdownByHeaders('../../public/housing_code.md')
    .then(chunk => console.log(chunk.length));

