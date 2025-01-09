import {QdrantClient} from "@qdrant/js-client-rest";

/*
The speed of indexation may become a bottleneck in this case, as each user’s vector will be indexed into the same collection. To avoid this bottleneck, consider bypassing the construction of a global vector index for the entire collection and building it only for individual groups instead.

By adopting this strategy, Qdrant will index vectors for each user independently, significantly accelerating the process.

To implement this approach, you should:

    Set payload_m in the HNSW configuration to a non-zero value, such as 16.
    Set m in hnsw config to 0. This will disable building global index for the whole collection.

 */

const client = new QdrantClient({host: "localhost", port: 6333});

client.createCollection("{belgian_law}", {
    vectors: {
        size: 1024,
        distance: "Cosine",
        datatype: "float32",
        on_disk: true
    },
    hnsw_config: {
        payload_m: 25,
        m: 64,
        ef_construct: 512,
        max_indexing_threads: 10,
        on_disk: true
    },
    quantization_config: {
        scalar: {
            type: 'int8',
            quantile: 0.99,
            always_ram: false
        }
    }
}).then(result => {

    if (!result) {
        console.log('failed to create collection belgian_law');
        return;

    } else {
        client.createPayloadIndex("{belgian_law}", {
            field_name: "sourceType",
            field_schema: {
                type: 'keyword',
                on_disk: false,
                is_tenant: true
            }
        }).then(result => {
            if (!result) {
                console.log('failed to created index sourceType')
                return;
            }
        })

        client.createPayloadIndex("{belgian_law}", {
            field_name: "sourceName",
            field_schema: {
                type: 'keyword',
                on_disk: false,
                is_tenant: true
            }
        }).then(result => {
            if (!result) {
                console.log('failed to created index sourceName')
                return;
            }
        })
    }
})


