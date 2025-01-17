import {tool} from '@langchain/core/tools';
import {z} from 'zod';
import {LegalSource, LegalSourceSchema} from '../../interface/legal-document.js';
import {extractContent} from '../../utils/message-to-string.js';
import {deterministicChatModel, writingChatModel} from '../ai-tool-factory.js';
import {LangGraphRunnableConfig} from '@langchain/langgraph';

const creativeValidator = writingChatModel();
const deterministicValidator = deterministicChatModel();

const SYSTEM_PROMPTS = {
    specification: `
    Input:
    You will receive
    1. a history of previous human messages,
    2. an implicit or explicit human interrogation that relates directly or indirectly to a legal issue or query.
    Instructions:
    Your task is to specify the question based on the human messages history, if the question is too broad or generic.
    The question might seem incomplete or too broad, but could be specified by the message history.
    Example of broad or incomplete questions:
    - "in criminal law ?"
    - "in family law, please."
    Verify that the human history added to the broad interrogation constitutes a more specific question. 
    If it does, rephrase the question so that it is more specific based on the messages history.
    Output:
    If the question is specific enough, output the human's question as is, without altering it.
    Else, if the question can be specified by the messages history, output a revised more specific question. 
    Strictly stick to the message history to specify the question.
    `,

    validation: `
    Input:
    You will receive an implicit or explicit human interrogation that relates directly or indirectly to a legal issue or query.
    Your task is to determine if the input relates somehow to housing law, family law, or criminal law - either directly or indirectly, explicitly or implicitly.
    Input Analysis Steps:
    1. Verify that the input is a question (explicit or implicit). 
    2. Check if the input directly references these broad legal or semantic domains: Housing, Family or Criminality
    3. If not direct, analyze for underlying legal or societal concepts by checking for:
       - Abstract discussions closely or remotely related to fundamental legal or societal concepts (consent, rights, obligations)
       - Philosophical questions closely or remotely related to legal principles
       - Societal debates closely or remotely related to legal frameworks
       - Personal questions closely or remotely related to legal matters or issues
    Only respond with:
    - 'yes' if:
      * The input is a question AND
      * It relates to housing, family, or criminal law (directly or indirectly)
    - 'no' for:
      * Non-questions
      * Questions outside these three legal domains
    `,

    sourceInference: `
    You are a legal source matcher. 
    Your task is to determine which specific legal source is most relevant to the input question.
    Analyze the question against these sources:
    1. brussels-housing-code: Housing matters within Brussels jurisdiction
    2. belgian-family-code: Family law matters
    3. belgian-penal-code: Criminal matters
    
    Rules:
    1. Consider only the above sources
    2. Select the single most relevant source
    3. If no source is clearly applicable, return unknown
    
    Output exactly one of:
    - brussels-housing-code
    - belgian-family-code
    - belgian-penal-code
    - unknown
    
    No other output or explanation is permitted.`
};

export const questionSpecifier = tool(
    async ({question, humanMessages}, config: LangGraphRunnableConfig) => {
        const response = await creativeValidator.invoke([
            {role: "system", content: SYSTEM_PROMPTS.specification},
            {
                role: "human",
                content: `
                Analyze this history 1) "${humanMessages.join(' ')}" and 2) this interrogation: ${question}. 
                If my interrogation specific enough, output my interrogation as is, without altering it. 
                Else, if should be specified using my messages history, output a revised more specific question as per your system instructions.
                `
            }
        ], {...config, tags: ['noStream']});

        return response.content as string;
    },
    {
        name: "specify_question",
        description: "Validates if a question is about law and specifically about one of the areas of law known by the application",
        schema: z.object({
            question: z.string().describe("The question to validate"),
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
            {role: "human", content: question}
        ], {...config, tags: ['noStream']});
        const inferredSource = extractContent(response).toLowerCase().trim();

        try {
            return LegalSourceSchema.parse(inferredSource) as LegalSource;
        } catch (error) {
            console.warn(`Invalid legal source inference ${inferredSource}. Defaulting to unknown.`, error);
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