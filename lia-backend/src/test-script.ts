import {KnowledgeBase} from "./offline-rag-prep/knowledge-base.js";

await KnowledgeBase.instance.addDocs(
    "../../public/legal-documents/law/brussels_housing_code.md",
    "brussels-housing-code",
    "law",
    "be-brussels"
)

await KnowledgeBase.instance.addDocs(
    "../../public/legal-documents/law/belgian_penal_code.md",
    "belgian-penal-code",
    "law",
    "be-federal"
)