import {JinaEmbeddings} from "@langchain/community/embeddings/jina";
import * as dotenv from 'dotenv';

dotenv.config();
export const jinaEmbeddings = new JinaEmbeddings({
    apiKey: process.env.JINA,
    model: "jina-embeddings-v3",
    dimensions: 1024,
    normalized: true
});