import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import {UnstructuredLoader} from "@langchain/community/document_loaders/fs/unstructured";
import {Document} from "@langchain/core/documents";
import { HfInference } from "@huggingface/inference";
import {AutoModel, AutoTokenizer, pipeline} from "@huggingface/transformers";

const loader = new UnstructuredLoader(
    "C:\\Users\\laure\\IdeaProjects\\lia\\public\\housing_code.md",
    {
        apiKey: "dVUvbzVnLji33vFpReFWZscLLyORF5",
        includePageBreaks: false,
        chunkingStrategy: "by_title",
        overlapAll: false
    }
);

const docs: Document<Record<string, string>>[] = await loader.load();
//console.log(docs);



/*
const pipe = await pipeline('embeddings', 'BAAI/bge-multilingual-gemma2');
const ems = pipe("some text");

console.log(ems);
*/
const tokenizer = await AutoTokenizer.from_pretrained("BAAI/bge-multilingual-gemma2")
const model = await AutoModel.from_pretrained("BAAI/bge-multilingual-gemma2")
const text = "Replace me by any text you'd like."
const encoded_input = await tokenizer(text)
const output = await model(encoded_input)
console.log(output)
