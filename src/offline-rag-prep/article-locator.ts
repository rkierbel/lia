import fs from "node:fs/promises";

export class ArticleLocator {

    public async contextualize(articleId: string, codePath: string): Promise<string> {
        return this.loadCodeStructure(codePath).then(structure => structure.get(articleId) ?? '');
    }

    private async loadCodeStructure(codePath: string): Promise<Map<string, string>> {
        const structure = await fs.readFile(codePath, {
            encoding: 'utf-8',
            flag: 'r',
        });
        return  new Map<string, string>(Object.entries(structure))
    }
}