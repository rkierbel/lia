import { Response } from 'express';
import { PregelOutputType } from "@langchain/langgraph/pregel";
import { IterableReadableStream } from "@langchain/core/utils/stream";

export async function handleStream(
    graphStream: IterableReadableStream<PregelOutputType>,
    res: Response
): Promise<void> {
    let breakAfter = false;

    for await (const chunk of graphStream) {
        if (chunk[1].langgraph_node !== 'pointOfContact' &&
            chunk[1].langgraph_node !== 'validationNode') {
            continue;
        }

        if (chunk[1].tags.some((tag: string) => tag === 'noStream')) {
            continue;
        }

        if (chunk[1].tags.some((tag: string) => tag === 'breakAfter')) {
            breakAfter = true;
        }

        if (breakAfter && chunk[1].langgraph_node === 'pointOfContact') {
            res.write('<br><br>');
            breakAfter = false;
        }

        res.write(chunk[0].content);
    }
}