import {ChatPromptTemplate} from "@langchain/core/prompts";
import {tool} from "@langchain/core/tools";
import {ChatOpenAI} from "@langchain/openai";
import {z} from "zod";
import {LegalSource, LegalSourceSchema} from "../../interface/legal-document.js";

const VALIDATOR_PROMPT = "You are a precise and thorough question content validator." +
    "Instructions:" +
    "You will receive a question as input. Upon receiving the question, you have one task." +
    "Your only task is to validate that the question is about law, and more specifically about one of the areas of law known by our application." +
    "You validate that the question is about one of the areas of law known by our application in a binary: you can only reply yes, or no." +
    "Areas of law known by our application: housing law, family law, criminal law." +
    "If the question is about an area of law known by our application, reply only: yes." +
    "If the question is not about an area of law known by our application, reply only: no." +
    "If the input you are given is not a question, just reply: no." +
    "These are the only two replies you can give, nothing else, under any circumstances."
;

const LEGAL_SOURCE_INFERENCE_PROMPT = "You are a precise and concise law area inference assistant." +
    "Instructions:" +
    "You will receive a question as input. Upon receiving the question, you have one task." +
    "Your only task is to infer the source of law to which the question relate solely based on the content and meaning of the question." +
    "Our application knows about a few sources of law only: brussels_housing_code, family_code, penal_code." +
    "Therefore, you have only two inference scenarios:" +
    "First scenario, you infer that the question does not pertain to one of the known sources limitatively enumerated above, your only reply should be: unknown." +
    "Second scenario, you infer that the question pertains to one of the known sources limitatively enumerated above. " +
    "In that case scenario, you reply one of the following, based on your inference: brussels_housing_code OR family_code OR penal_code." +
    "Your reply can ever only be one single word, that is either unknown, brussels_housing_code, family_code or penal_code, based on the inference you made."
;

const validationPrompt = ChatPromptTemplate.fromMessages([
    ["system", VALIDATOR_PROMPT],
    ["human", "{question}"]
]);

const legalSourceInferencePrompt = ChatPromptTemplate.fromMessages([
    ["system", LEGAL_SOURCE_INFERENCE_PROMPT],
    ["human", "{question}"]
]);

export const questionValidator = tool(
    async ({question}) => {
        const model = new ChatOpenAI({
            modelName: "gpt-4",
            temperature: 0
        });

        const chain = validationPrompt.pipe(model);
        const isQuestionLegal = await chain.invoke({question});

        let contentStr: string;
        if (Array.isArray(isQuestionLegal.content)) {
            contentStr = isQuestionLegal.content.map(part =>
                JSON.stringify(part)).join(' ');
        } else {
            contentStr = isQuestionLegal.content;
        }
        return contentStr.toLowerCase().includes('yes') ? "yes" : "no";
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
    async ({question}) => {
        const model = new ChatOpenAI({
            modelName: "gpt-4",
            temperature: 0
        });

        const chain = legalSourceInferencePrompt.pipe(model);
        const sourceName = await chain.invoke({question});

        let contentStr: string;
        if (Array.isArray(sourceName.content)) {
            contentStr = sourceName.content.map(part =>
                JSON.stringify(part)).join(' ');
        } else {
            contentStr = sourceName.content;
        }

        try {
            return LegalSourceSchema.parse(contentStr.toLowerCase().trim()) as LegalSource;
        } catch (error) {
            console.warn(`Invalid legal source inference ${contentStr}. Defaulting to unknown. Error:`, error);
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