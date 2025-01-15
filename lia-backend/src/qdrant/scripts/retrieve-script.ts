//import {QdrantClient} from "@qdrant/js-client-rest";
import {KnowledgeBase} from "../../offline-rag-prep/knowledge-base.js";

//const client = new QdrantClient({host: "localhost", port: 6333});


/*
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
*/

/*client.count("{belgian_law}", {
    filter: {
        must: [
            {
                key: "sourceName",
                match: {
                    value: "brussels-housing-code",
                },
            },
            {
                key: "sourceType",
                match: {
                    value: "law",
                },
            },
        ],
    },
    exact: true,
}).then(c => console.log(JSON.stringify(c)));*/

/*new QdrantSearchWrapper().similaritySearch(
    "Existe-t-il une trêve hivernale à Bruxelles en droit du logement ?",
    "brussels-housing-code",
    "law")
    .then(r => console.log(r));*/


const retriever = await new KnowledgeBase().retriever(
    "brussels-housing-code"
);

retriever.invoke("trêve hivernale").then(
    d => console.log(JSON.stringify(d))
);