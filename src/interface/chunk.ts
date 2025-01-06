export interface Chunk {
    content: string,
    metadata: ChunkMetadata
}

export interface ChunkMetadata {
    partitionKey: string,
    contentId: string
}