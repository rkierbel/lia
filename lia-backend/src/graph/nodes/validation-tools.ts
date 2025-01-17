import {tool} from '@langchain/core/tools';
import {z} from 'zod';
import {LegalSource, LegalSourceSchema} from '../../interface/legal-document.js';
import {UserLang, UserLangSchema} from '../../interface/user-lang.js';
import {extractContent} from '../../utils/message-to-string.js';
import {deterministicChatModel, writingChatModel} from '../ai-tool-factory.js';
import {LangGraphRunnableConfig} from '@langchain/langgraph';

const creativeValidator = writingChatModel();
const  deterministicValidator = deterministicChatModel();

const SYSTEM_PROMPTS = {
    validation: `
    You will receive an implicit or explicit human question that relates directly or indirectly to a legal issue or query.
    Your task is to determine if the input question relates somehow to housing law, family law, or criminal law - either directly or indirectly, explicitly or implicitly.
    Input Analysis Steps:
    1. Verify that the input is a question (explicit or implicit)
    2. Check if the input directly references these broad legal or semantic domains:
       - Housing
       - Family
       - Criminality
    3. If not direct, analyze for underlying legal or societal concepts by checking for:
       - Abstract discussions closely or remotely related to fundamental legal or societal concepts (consent, rights, obligations)
       - Philosophical questions closely or remotely related to legal principles
       - Societal debates closely or remotely related to legal frameworks
       - Questions about power dynamics that are closely or remotely related to legal matters or issues
       - Personal autonomy questions closely or remotely related to legal matters or issues
    Only respond with:
    - 'yes' if:
      * The input is a question AND
      * It relates to housing, family, or criminal law (directly or indirectly)
    - 'no' for:
      * Non-questions
      * Questions outside these three legal domains
    
    Examples:
    "Can my landlord increase rent without notice?" -> yes (direct housing law)
    "My roommate keeps having loud parties, what can I do?" -> yes (indirect housing law)
    "What happens if my ex won't let me see the kids?" -> yes (direct family law)
    "Is it okay to record my neighbor?" -> yes (indirect criminal law)
    "Can I kill someone ?" -> yes (indirect criminal law)
    "What's the best pizza in town?" -> no (unrelated)
    "I hate my job" -> no (not a question and unrelated)
    "Le consentement, ça existe vraiment?" -> yes (indirect criminal law)
    "C'est quoi le consentement ?" -> yes (indirect criminal law)
    "Does consent really exist?" -> yes (indirect criminal law - consent)
    "Who decides what's right and wrong?" -> yes (indirect criminal law - legal principles)`,

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
    
    No other output or explanation is permitted.`,

    languageDetection: `
    You are a language detection expert.
    Given text, identify if it is English, French, or Dutch.
    Reply only with: 'en', 'fr', or 'nl'.
    Default to 'en' if uncertain.
    No other output or explanation is permitted.`
};

export const questionValidator = tool(
    async ({question}, config: LangGraphRunnableConfig) => {
        const response = await creativeValidator.invoke([
            { role: "system", content: SYSTEM_PROMPTS.validation },
            { role: "human", content: question }
        ], {...config, tags:['noStream']});

        return extractContent(response).toLowerCase().includes('yes') ? "yes" : "no";
    },
    {
        name: "validate_legal_question",
        description: "Validates if a question is about law and specifically about one of the areas of law known by the application",
        schema: z.object({
            question: z.string().describe("The question to validate")
        })
    }
);

export const legalSourceInference = tool(
    async ({question}, config: LangGraphRunnableConfig) => {
        const response = await deterministicValidator.invoke([
            { role: "system", content: SYSTEM_PROMPTS.sourceInference },
            { role: "human", content: question }
        ], {...config, tags:['noStream']});
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

export const languageDetector = tool(
    async ({question}, config: LangGraphRunnableConfig): Promise<UserLang> => {
        const response = await deterministicValidator.invoke([
            { role: "system", content: SYSTEM_PROMPTS.languageDetection },
            { role: "human", content: question }
        ], {...config, tags:['noStream']});
        const detectedLang = extractContent(response).toLowerCase().trim();

        try {
            return UserLangSchema.parse(detectedLang);
        } catch (error) {
            console.warn(`Invalid language detection ${detectedLang}. Defaulting to 'en'.`, error);
            return "en" as const;
        }
    },
    {
        name: "detect_language",
        description: "Detects the language of the input question",
        schema: z.object({
            question: z.string().describe("The question to detect the language of")
        })
    }
);