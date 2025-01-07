import {MarkdownTextSplitter} from '../offline-rag-prep/markdown-text-splitter.js';
import {OfflineTextEmbedding} from '../offline-rag-prep/offline-text-embedding.js';


new MarkdownTextSplitter()
    .splitMarkdownByHeaders('../../public/housing_code.md')
    .then(chunk => chunk.forEach(c => console.log(c)));

['My tailor is rich', 'Hello darkness my old friend'].forEach(
    s => {
        new OfflineTextEmbedding()
            .embed(s)
            .then(resp => {
                resp.forEach(v => console.log(v));
            });
    }
);
