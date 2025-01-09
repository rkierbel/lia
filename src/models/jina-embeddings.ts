import {JinaEmbeddings} from "@langchain/community/embeddings/jina";

export const jinaEmbeddings = new JinaEmbeddings({
    apiKey: 'jina_3f47a80afd5b42d9985ba7fca8bedfe9WHcMCRMvQ7lQ-FheqfABgp7LF2ae',
    model: "jina-embeddings-v3",
    dimensions: 1024,
    normalized: true
});