import {Annotation, END, START, StateGraph} from "@langchain/langgraph";
import {AIMessage, BaseMessage, HumanMessage} from "@langchain/core/messages";
import {ToolNode} from "@langchain/langgraph/prebuilt";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {ChatOpenAI} from "@langchain/openai";
import {pull} from "langchain/hub";
import { z } from "zod";
import { createRetrieverTool } from "langchain/tools/retriever";
import {KnowledgeBase} from "../offline-rag-prep/knowledge-base.js";

const GraphState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    })
})

const retriever = await new KnowledgeBase().retriever("brussels-housing-code", "law");

const tool = createRetrieverTool(
    retriever,
    {
        name: "anwser_brussels_housing_law_question",
        description: "Search and return information about questions related to housing law in Brussels."
    }
);
const tools = [tool];

const toolNode = new ToolNode<typeof GraphState.State>(tools);

function shouldRetrieve(state: typeof GraphState.State): string {
    const {messages} = state;
    console.log("---DECIDE TO RETRIEVE---");
    const lastMessage = messages[messages.length - 1];

    if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length) {
        console.log("---DECISION: RETRIEVE---");
        return "retrieve";
    }
    // If there are no tool calls then we finish.
    return END;
}

async function gradeDocuments(state: typeof GraphState.State): Promise<Partial<typeof GraphState.State>> {
    console.log("---GET RELEVANCE---");

    const {messages} = state;
    const tool = {
        name: "give_relevance_score",
        description: "Give a relevance score to the retrieved documents.",
        schema: z.object({
            binaryScore: z.string().describe("Relevance score 'yes' or 'no'"),
        })
    }

    const prompt = ChatPromptTemplate.fromTemplate(
        `You are a grader assessing relevance of retrieved docs to a user question. Here are the retrieved docs:
        \n ------- \n
        {context} 
        \n ------- \n
        Here is the user question: {question}
        If the content of the docs are relevant to the users question, score them as relevant.
        Give a binary score 'yes' or 'no' score to indicate whether the docs are relevant to the question.
        Yes: The docs are relevant to the question.
        No: The docs are not relevant to the question.`,
    );

    const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0,
        apiKey: ""
    }).bindTools([tool], {
        tool_choice: tool.name,
    });

    const chain = prompt.pipe(model);

    const lastMessage = messages[messages.length - 1];

    const score = await chain.invoke({
        question: messages[0].content as string,
        context: lastMessage.content as string,
    });

    return {
        messages: [score]
    };
}

function checkRelevance(state: typeof GraphState.State): string {
    console.log("---CHECK RELEVANCE---");

    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    if (!("tool_calls" in lastMessage)) {
        throw new Error("The 'checkRelevance' node requires the most recent message to contain tool calls.")
    }
    const toolCalls = (lastMessage as AIMessage).tool_calls;
    if (!toolCalls || !toolCalls.length) {
        throw new Error("Last message was not a function message");
    }

    if (toolCalls[0].args.binaryScore === "yes") {
        console.log("---DECISION: DOCS RELEVANT---");
        return "yes";
    }
    console.log("---DECISION: DOCS NOT RELEVANT---");
    return "no";
}

async function agent(state: typeof GraphState.State): Promise<Partial<typeof GraphState.State>> {
    console.log("---CALL AGENT---");

    const { messages } = state;
    // Find the AIMessage which contains the `give_relevance_score` tool call,
    // and remove it if it exists. This is because the agent does not need to know
    // the relevance score.
    const filteredMessages = messages.filter((message) => {
        if ("tool_calls" in message && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
            return message.tool_calls[0].name !== "give_relevance_score";
        }
        return true;
    });

    const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0,
        streaming: true,
        apiKey: ""
    }).bindTools(tools);

    const response = await model.invoke(filteredMessages);
    return {
        messages: [response],
    };
}

async function rewrite(state: typeof GraphState.State): Promise<Partial<typeof GraphState.State>> {
    console.log("---TRANSFORM QUERY---");

    const { messages } = state;
    const question = messages[0].content as string;
    const prompt = ChatPromptTemplate.fromTemplate(
        `Look at the input and try to reason about the underlying semantic intent / meaning. \n 
        Here is the initial question:
        \n ------- \n
        {question} 
        \n ------- \n
        Formulate an improved question:`,
    );

    // Grader
    const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0,
        streaming: true,
        apiKey: ""
    });
    const response = await prompt.pipe(model).invoke({ question });
    return {
        messages: [response],
    };
}

async function generate(state: typeof GraphState.State): Promise<Partial<typeof GraphState.State>> {
    console.log("---GENERATE---");

    const { messages } = state;
    const question = messages[0].content as string;
    // Extract the most recent ToolMessage
    const lastToolMessage = messages.slice().reverse().find((msg) => msg._getType() === "tool");
    if (!lastToolMessage) {
        throw new Error("No tool message found in the conversation history");
    }

    const docs = lastToolMessage.content as string;

    const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

    const llm = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0,
        streaming: true,
        apiKey: ""
    });

    const ragChain = prompt.pipe(llm);

    const response = await ragChain.invoke({
        context: docs,
        question,
    });

    return {
        messages: [response],
    };
}

const workflow = new StateGraph(GraphState)
    // Define the nodes which we'll cycle between.
    .addNode("agent", agent)
    .addNode("retrieve", toolNode)
    .addNode("gradeDocuments", gradeDocuments)
    .addNode("rewrite", rewrite)
    .addNode("generate", generate);

// Call agent node to decide to retrieve or not
workflow.addEdge(START, "agent");

// Decide whether to retrieve
workflow.addConditionalEdges(
    "agent",
    // Assess agent decision
    shouldRetrieve,
);

workflow.addEdge("retrieve", "gradeDocuments");

// Edges taken after the `action` node is called.
workflow.addConditionalEdges(
    "gradeDocuments",
    // Assess agent decision
    checkRelevance,
    {
        // Call tool node
        yes: "generate",
        no: "rewrite", // placeholder
    },
);

workflow.addEdge("generate", END);
workflow.addEdge("rewrite", "agent");

// Compile
const app = workflow.compile();

const inputs = {
    messages: [
        new HumanMessage(
            "Is there something in brussels housing law like a 'trêve hivernale'? " +
            "Only use articles of the brussels housing code to reply. " +
            "Provide the references to the articles that you used. " +
            "If an article is referencing another article of the same code, check that reference in the brussels housing code to supplement your answer." +
            "Do not check references to articles or legal sources that are not the Brussels housing code." +
            "Only base your answer on the brussels housing code.",
        ),
    ],
};
let finalState;
for await (const output of await app.stream(inputs)) {
    for (const [key, value] of Object.entries(output)) {
        const lastMsg = output[key].messages[output[key].messages.length - 1];
        console.log(`Output from node: '${key}'`);
        console.dir({
            type: lastMsg._getType(),
            content: lastMsg.content,
            tool_calls: lastMsg.tool_calls,
        }, { depth: null });
        console.log("---\n");
        finalState = value;
    }
}

console.log(JSON.stringify(finalState, null, 2));