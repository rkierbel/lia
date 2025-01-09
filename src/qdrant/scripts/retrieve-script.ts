import {QdrantClient} from "@qdrant/js-client-rest";

const client = new QdrantClient({host: "localhost", port: 6333});

client.scroll("{belgian_law}", {
    filter: {
        must: [
            {
                key: "elementRef",
                match: {
                    value: "brussels-housing-code-166bis/1",
                },
            },
        ],
    },
    limit: 1,
    with_payload: true,
    with_vector: true,
}).then(res => {
    console.log(JSON.stringify(res))
});