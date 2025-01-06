import {UnstructuredLoader} from '@langchain/community/document_loaders/fs/unstructured';
import {Document} from '@langchain/core/documents';


const loader = new UnstructuredLoader(
    'public/housing_code.md',
    {
        apiKey: 'dVUvbzVnLji33vFpReFWZscLLyORF5',
        includePageBreaks: false,
        chunkingStrategy: 'by_title',
        maxCharacters: 13050,
        overlapAll: false
    }
);

const docs: Document<Record<string, string>>[] = await loader.load();

for (const doc in docs)  {
    console.log(doc)
}

/*
async function query(data: string) {
    const response = await fetch(
        'https://z4g6g8n5rney8aq1.us-east4.gcp.endpoints.huggingface.cloud',
        {
            headers: {
                Accept : "application/json",
                Authorization: 'Bearer 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',
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
                inputs: data
            }),

        }
    );
    console.log(response);
    return await response.json();
}

for (const doc of ["hello darkness", "my old friend"]) {
    try {
        const response = await query(doc);
        console.log(JSON.stringify(response));
    } catch (error) {
        console.log("error:", error);
    }
}
*/