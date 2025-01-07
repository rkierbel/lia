import { JinaEmbeddings } from "@langchain/community/embeddings/jina";

export class OfflineTextEmbedding {

    public async embed(data: string) {

        const jina = new JinaEmbeddings({
            apiKey: process.env.JINA,
            model: "jina-embeddings-v3",
            dimensions: 1024,
            normalized: true
        });

        const embeddings = await jina.embedDocuments([data]);
        console.log(embeddings);
    }
}



