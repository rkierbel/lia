import {KnowledgeBase} from "./rag-tooling/knowledge-base.js";
import {MarkdownTextSplitter} from "./rag-tooling/markdown-text-splitter.js";


/*await KnowledgeBase.instance.addDocs(
    "../public/legal-documents/law/belgian_civil_code_extracontractual_liability.md",
    "belgian-civil-code-extra-contractual-liability",
    "law",
    "be-federal"
)/*
const res = await new MarkdownTextSplitter().splitMarkdownByHeaders("../public/legal-documents/law/belgian_civil_code_obligations.md");
res.forEach(c => console.log(c));

 */