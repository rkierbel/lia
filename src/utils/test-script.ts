import {MarkdownTextSplitter} from '../offline-rag-prep/markdown-text-splitter.js';


new MarkdownTextSplitter().splitMarkdownByHeaders('../../public/legal-documents/law/brussels_housing_code.md')
    .then(chunk => console.log(chunk.length));

