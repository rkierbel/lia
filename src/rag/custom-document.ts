import {ChunkMetadata} from '../interface/chunk.js';
import {Document} from '@langchain/core/documents';

export class CustomDocument extends Document {

    constructor(fields: {
        pageContent: string;
        metadata: ChunkMetadata;
    }) {
        super(fields);
    }
}