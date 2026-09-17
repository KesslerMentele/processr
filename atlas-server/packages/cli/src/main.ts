import type { Gamepack } from 'atlas-language';
import { createAtlasServices, AtlasLanguageMetaData } from 'atlas-language';
import chalk from 'chalk';
import { Command } from 'commander';
import { extractAstNode } from './util.js';
import { generateGamePack } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createAtlasServices(NodeFileSystem).Atlas;
    const gamepack = await extractAstNode<Gamepack>(fileName, services);
    const generatedFilePath = generateGamePack(gamepack, fileName, opts.destination);
    console.log(chalk.green(`GamePack JSON generated successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = AtlasLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates a GamePack JSON file from an Atlas (.prat) gamepack definition')
        .action(generateAction);

    program.parse(process.argv);
}
