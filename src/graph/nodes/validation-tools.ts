import {tool} from '@langchain/core/tools';
import {z} from 'zod';
import {extractContent} from '../utils/message-to-string.js';
import {LangGraphRunnableConfig} from '@langchain/langgraph';
import {LegalSource, LegalSourceSchema, sources} from "../../interface/legal-source-name.js";
import {AiToolProvider, creativeModel, deterministicModel} from "../utils/ai-tools.js";

const creativeValidator = creativeModel(AiToolProvider.DEEPSEEK);
const deterministicValidator = deterministicModel(AiToolProvider.DEEPSEEK);

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
    Process: first, assess if you are asked a question. Explicit or implicit. Non-questions: output no.
    Second, determine if it relate remotely or closely to housing, civil, or criminal law?
    Close relation to law: the question mentions legal domains/subfields.
    Remote relation to law: the question raises concepts loosely to legal notions, concepts, rights, obligations, liability, property, consent, or societal debates.
    Rule: Output contains only yes or no.
    Output:
    yes, if the question (explicit/implicit) could require legal analysis of the specified domains, even via broad or abstract principles.
    no, if non-question or question is unrelated to the domains covered by the app.
    `,

    sourceInference: `
    Task: Match the input question to pre-defined legal sources (including preparatory works when applicable).
    Sources list (exact names): ${sources}.
    Rules:
    A source is relevant if the question directly/indirectly/explicitly/implicitly relates to the source’s name.
    Upon selecting a given source name, always include in your final list its related prepwork prefixed source name, if it exists.
    Example: you select belgian-civil-code-extra-contractual-liability. 
    Then, you MUST also include in your list prepwork-belgian-civil-code-extra-contractual-liability, 
    because it exists in the list of curated source names.
    Return unknown if no source aligns confidently, the question is too broad/vague, or the terminology is grossly irrelevant to sources.
    Output:
    Comma-separated source names or unknown.
    There should be no other characters that the ones mentioned above.
    Do not deviate in source names, spacing, line breaks, or formatting.
    `
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