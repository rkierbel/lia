import {tool} from '@langchain/core/tools';
import {z} from 'zod';
import {LegalSource, LegalSourceSchema} from '../../interface/legal-document.js';
import {UserLang, UserLangSchema} from '../../interface/user-lang.js';
import {extractContent} from '../../utils/message-to-string.js';
import {ToolNode} from '@langchain/langgraph/prebuilt';
import {PointOfContactAnnotation} from '../state.js';
import {createChatModel} from '../ai-tool-factory.js';
import {LangGraphRunnableConfig} from '@langchain/langgraph';

const model = createChatModel();

const SYSTEM_PROMPTS = {
    validation: `
    You are a precise legal question validator. 
    Your task is to determine if an input is a question that has implications for housing law, family law, or criminal law - either direct or indirect.
    Input Analysis Steps:
    1. Verify if the input is a question (explicit or implicit)
    2. Check if the question directly references these legal domains:
       - Housing law (tenancy, property, landlord-tenant relationships)
       - Family law (marriage, divorce, custody, inheritance)
       - Criminal law (offenses, prosecution, defense)
    3. If not direct, analyze for indirect implications by checking for:
       - References to living arrangements or property usage
       - Mentions of family relationships or domestic situations
       - Situations involving potential legal violations or harm
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
    "I hate my job" -> no (not a question and unrelated)`,

    sourceInference: `
    You are a legal source matcher. 
    Your task is to determine which specific legal code is most relevant to the input question.
    Analyze the question against these sources:
    1. brussels-housing-code: Housing matters within Brussels jurisdiction
    2. belgian-family-code: Family law matters in Belgium
    3. belgian-penal-code: Criminal matters in Belgium
    
    Rules:
    1. Consider only the above sources
    2. Select the single most relevant source
    3. If no source is clearly applicable, return 'unknown'
    
    Output exactly one of:
    - 'brussels-housing-code'
    - 'belgian-family-code'
    - 'belgian-penal-code'
    - 'unknown'
    
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
        const response = await model.invoke([
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
        const response = await model.invoke([
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
        const response = await model.invoke([
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

export const toolNode = new ToolNode<typeof PointOfContactAnnotation.State>([
    questionValidator,
    legalSourceInference,
    languageDetector
]);