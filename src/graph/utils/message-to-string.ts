import {BaseMessage} from "@langchain/core/messages";

export function extractContent(toExtract: BaseMessage): string {
    if (Array.isArray(toExtract.content)) {
        return toExtract.content.map(part =>
            JSON.stringify(part)
        ).join(' ');
    } else {
        return toExtract.content as string;
    }
}