import { QdrantVectorStore } from "@langchain/qdrant";
import {QdrantClient} from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });
/*
The speed of indexation may become a bottleneck in this case, as each user’s vector will be indexed into the same collection. To avoid this bottleneck, consider bypassing the construction of a global vector index for the entire collection and building it only for individual groups instead.

By adopting this strategy, Qdrant will index vectors for each user independently, significantly accelerating the process.

To implement this approach, you should:

    Set payload_m in the HNSW configuration to a non-zero value, such as 16.
    Set m in hnsw config to 0. This will disable building global index for the whole collection.

 */
client.createCollection("{belgian_law_codes}", {
    vectors: {
        size: 1024,
        distance: "Cosine",
        datatype: "float16",
        on_disk: true
    },
    hnsw_config: {
        payload_m: 25,
        m: 50,
        ef_construct: 260,
        max_indexing_threads: 10
    },

    on_disk_payload: true
});

client.createPayloadIndex("{collection_name}", {
    field_name: "name_of_the_field_to_index",
    field_schema: "keyword",
});