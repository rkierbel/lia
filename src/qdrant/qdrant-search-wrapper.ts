import dotenv from "dotenv";
import {JinaEmbeddings} from "@langchain/community/embeddings/jina";
import {QdrantClient} from "@qdrant/js-client-rest";

dotenv.config({path:'../../../.env'});

export class QdrantSearchWrapper {

    private embeddingModel = new JinaEmbeddings({
        apiKey: process.env.JINA,
        model: "jina-embeddings-v3",
        dimensions: 1024,
        normalized: true
    });

    private client = new QdrantClient({
        url: "http://localhost:6333"
    });

    public async similaritySearch(query: string,
                                  sourceName: string,
                                  sourceType: string): Promise<string> {
        const filter = {
            must: [
                {key: 'sourceName', match: { value: sourceName}},
                {key: 'sourceType', match: { value: sourceType}},
            ]
        };
        const queryEmbedding = await this.embeddingModel.embedQuery(query);
        const resultsQdrant = await this.client.query("{belgian_law}", {
            query: queryEmbedding,
            limit: 10,
            filter,
            with_payload: true,
            with_vector: true
        });

        // convert the resultsQdrant to list of Documents with pageContent and metadata
        return JSON.stringify(resultsQdrant);
    }
}

/*

{"id":"8e02478e-b688-4412-9f64-402f05797fef","version":4,"score":0.61081713,"payload":{
"sourceName":"brussels-housing-code","sourceType":"law","elementRef":"brussels-housing-code-11"}
 */