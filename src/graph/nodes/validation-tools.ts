import {tool} from '@langchain/core/tools';
import {z} from 'zod';
import {LegalSource, LegalSourceSchema} from '../../interface/custom-document.js';
import {extractContent} from '../utils/message-to-string.js';
import {deterministicChatModel, writingChatModel} from '../utils/ai-tool-factory.js';
import {LangGraphRunnableConfig} from '@langchain/langgraph';

const creativeValidator = writingChatModel();
const deterministicValidator = deterministicChatModel();

const SYSTEM_PROMPTS = {
    specification: `
    Task: refine broad/generic legal questions using message history only if the history provides the missing context.
    Process: 
    Start by assessing the specificity of the input question.
        Specific: includes actionable details (parties, events, legal concepts).
        Example: “Can my landlord increase rent during a fixed-term lease?”
        Broad/Vague: Lacks context or is fragmentary.
        Examples: “In criminal law?”, “What about property rights?”
    Use the message history to refine the input question.
        Revise only if the message history contains: either prior details 
        (e.g., “My landlord entered without notice” + “In housing law?” → “Can my landlord enter my rental unit without notice?”),
        or clarifying context (e.g., “I donated money to my nephew” + “Inheritance?” → “Does my donation affect my nephew’s inheritance rights?”).
    Output Rules: return the original question if it’s already specific. 
    Revise only with explicit context from history; never invent facts.
    Examples:
    Input (History: “My partner and I split. We own a house.” + Question: “In patrimonial relations?”)
    Output: “How is our jointly owned house divided under patrimonial relations law after separation?”
    Input (Specific Question: “Is a verbal lease valid in Brussels?”)
    Output: “Is a verbal lease valid in Brussels?”
    `,

    validation: `
    Task: validate if a user’s input is a legal question within housing, civil, or criminal law, including philosophical/societal concepts implying a legal principle.
    Process:
        Is it a question? Explicit (“Can I sue my landlord?”) or implicit (“My spouse hid assets”). Non-questions: output no.
        Does it relate remotely or closely to housing, civil, or criminal law?
            Close relation: mentions legal domains/subfields (e.g., evictions, contracts, inheritance, assault);
            Remote relation: raises concepts tied to legal rights, obligations, liability, property, consent, or societal debates (e.g., “Is it ethical to withhold rent?” has housing law implications).
    Rule: Output contains only yes or no.
    Output:
        yes, if the question (explicit/implicit) could require legal analysis of the specified domains, even via abstract principles.
        no, if non-question or unrelated to the domains (e.g., tax, corporate law).
    `,

    sourceInference: `
    Task: Match the input question to pre-defined legal sources.
    Sources list (exact names):
    brussels-housing-code, belgian-civil-code-general-provisions, belgian-civil-code-inheritance-donations-wills, belgian-civil-code-patrimonial-relations-and-couples, belgian-civil-code-property, belgian-civil-code-evidence, belgian-civil-code-obligations, belgian-civil-code-extra-contractual-liability, belgian-penal-code.
    Rules:
        Relevance = question directly/indirectly/explicitly/implicitly addresses the source’s core subject remotely or closely, its regulated legal/societal/philosophical concepts (e.g., inheritance, liability, family, crime, persons, etc), or references its provisions.
        Exclusion = return unknown if no source aligns confidently, the question is too broad/vague, or terminology is irrelevant to sources.
    Output:
        Comma-separated source names (e.g., belgian-civil-code-property,belgian-penal-code) or unknown.
        There should be no other characters that the ones mentioned above: no deviations in source names, spacing, line breaks, or formatting.
    Examples:
        Valid: belgian-civil-code-obligations
        Valid: brussels-housing-code,belgian-civil-code-evidence
        Invalid: civil-code (incorrect name), unknown (space).`
};

export const questionSpecifier = tool(
    async ({question, humanMessages}, config: LangGraphRunnableConfig) => {
        const response = await creativeValidator.invoke([
            {role: "system", content: SYSTEM_PROMPTS.specification},
            {
                role: "human",
                content: `
                Analyze this message history "${humanMessages.join(' ')}" and my interrogation: ${question}. 
                If my interrogation is specific enough, output my interrogation as is, without altering it. 
                Else if my interrogation should be specified using my messages history, output a revised more specific question as per your system instructions.
                Else, output unknown as per your system instructions.
                `
            }
        ], {...config, tags: ['noStream']});

        console.log("Question specified: ", response.content);

        return response.content as string;
    },
    {
        name: "specify_question",
        description: "Specifies a question if too broad or generic based on the user's message history",
        schema: z.object({
            question: z.string().describe("The question to specify"),
            humanMessages: z.array(z.string()).describe("The previous human messages")
        })
    }
)

export const questionValidator = tool(
    async ({question}, config: LangGraphRunnableConfig) => {
        const response = await creativeValidator.invoke([
            {role: "system", content: SYSTEM_PROMPTS.validation},
            {
                role: "human",
                content: `Verify the validity of this question according to your system instructions: ${question}`
            }
        ], {...config, tags: ['noStream']});

        return extractContent(response).toLowerCase().includes('yes') ? "yes" : "no";
    },
    {
        name: "validate_legal_question",
        description: "Validates if a question is about law and specifically about one of the areas of law known by the application",
        schema: z.object({
            question: z.string().describe("The question to validate"),
        })
    }
);

export const legalSourceInference = tool(
    async ({question}, config: LangGraphRunnableConfig) => {
        const response = await deterministicValidator.invoke([
            {role: "system", content: SYSTEM_PROMPTS.sourceInference},
            {
                role: "human",
                content: `Based on your system instructions, identify which legal sources from the predefined list the question relates to, remotely or closely: ${question}`
            }
        ], {...config, tags: ['noStream']});
        const sourcesAsString = extractContent(response).toLowerCase().trim();
        try {
            if (sourcesAsString === 'unknown')
                return [LegalSourceSchema.parse(sourcesAsString).trim()];
            else {
                const sources = sourcesAsString.split(",").map(src => LegalSourceSchema.parse(src).trim() as LegalSource);
                console.log("INFERENCE - sources", sources);
                return sources;
            }
        } catch (error) {
            console.warn(`Invalid legal source inference ${sourcesAsString}. Defaulting to unknown.`, error);
            return "unknown" as const;
        }
    },
    {
        name: "infer_legal_source",
        description: "Infers the source of law that a question relates to",
        schema: z.object({
            question: z.string().describe("The legal question to analyze")
        })
    }
)