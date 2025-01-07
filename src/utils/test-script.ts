//import {MarkdownTextSplitter} from '../offline-rag-prep/markdown-text-splitter.js';
import {OfflineTextEmbedding} from '../offline-rag-prep/offline-text-embedding.js';

/*
new MarkdownTextSplitter()
    .splitMarkdownByHeaders('../../public/housing_code.md')
    .then(chunk => chunk.forEach(c => console.log(c)));
*/
new OfflineTextEmbedding().embed("eeeeee");
