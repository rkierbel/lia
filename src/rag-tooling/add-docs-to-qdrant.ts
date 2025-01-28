/*

import {KnowledgeBase} from "./knowledge-base";
import {LegalSource} from "../interface/legal-source-name";

const sources = [
    ["../../public/legal-documents/law/prepwork_belgian_civil_code_patrimonial_relations_couples_inheritance_donations_wills.md", "prepwork-belgian-civil-code-patrimonial-relations-couples-inheritance-donations-wills.md", "be-federal"],
    ["../../public/legal-documents/law/prepwork_belgian_civil_code_property.md", "prepwork-belgian-civil-code-property.md", "be-federal"],
    ["../../public/legal-documents/law/prepwork_belgian_civil_code_obligations.md", "prepwork-belgian-civil-code-obligations.md", "be-federal"]
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




const res = await new MarkdownTextSplitter().splitMarkdownOnLvl4Headers(
    "../../public/legal-documents/law/prepwork_civil_code_extracontractual_liability.md",
    "(prep work BE civil code)");
res.forEach(c => console.log(c));
console.log(res.length);
*/




