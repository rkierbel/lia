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
    You are a precise question validator for legal questions.
    Validate if the question is about: housing law, family law or criminal law.
    Reply only 'yes' or 'no'.
    If input is not a question, reply 'no'.`,

    sourceInference: `
    You are a law area inference assistant.
    Determine which source matches the question. Output only one of the following:
    - brussels-housing-code
    - belgian-family-code
    - belgian-penal-code
    If none match, output only: unknown.
    Only reply with one of these exact terms.`,

    languageDetection: `
    You are a language detection expert.
    Given text, identify if it is English, French, or Dutch.
    Reply only with: 'en', 'fr', or 'nl'.
    Default to 'en' if uncertain.`
};

export const questionValidator = tool(
    async ({question}, config: LangGraphRunnableConfig) => {
        const response = await model.invoke([
            { role: "system", content: SYSTEM_PROMPTS.validation },
            { role: "human", content: question }
        ], config);

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
        ], config);
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
        ], config);
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