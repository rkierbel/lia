import {KnowledgeBase} from "../knowledge-base";
import {LegalSource} from "../../interface/legal-source-name";

const sources = [
    ["../../public/legal-documents/law/prepwork_belgian_civil_code_extracontractual_liability.md", "prepwork-belgian-civil-code-extra-contractual-liability", "be-federal"]
]

for (const src of sources) {
    console.log('adding -> ' +src[0]);
    await KnowledgeBase.instance.addPrepWorkDocs(
        src[0],
        src[1] as LegalSource,
        src[2],
        "(prep work BE civil code)"
    )

}




/*import {MarkdownTextSplitter} from "./markdown-text-splitter";

const res = await new MarkdownTextSplitter().splitMarkdownOnLvl4Headers(
    "../../public/legal-documents/law/prepwork_belgian_civil_code_extracontractual_liability.md",
    "(prep work BE civil code)");
res.forEach(c => console.log(c));
console.log(res.length);*/





