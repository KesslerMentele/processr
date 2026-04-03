import type OpenAI from 'openai';
import { parsePackText } from '../parser/parse.js';

export const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'validate_atlas',
            description:
                'Validate Atlas (.prat) syntax using the real parser. ' +
                'Call this on your generated text before submitting. ' +
                'Returns errors if invalid, or confirms success.',
            parameters: {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: 'The Atlas (.prat) code to validate.',
                    },
                },
                required: ['text'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'submit_atlas',
            description:
                'Return the validated Atlas code to the user. ' +
                'Only call this after validate_atlas has confirmed the code is valid.',
            parameters: {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: 'The validated Atlas (.prat) code to return.',
                    },
                },
                required: ['text'],
            },
        },
    },
];

export type ToolResult =
    | { type: 'validate'; valid: true }
    | { type: 'validate'; valid: false; errors: string[] }
    | { type: 'submit'; text: string }
    | { type: 'reject'; reason: string };

export async function handleToolCall(
    name: string,
    args: Record<string, string>,
    existingPack?: string,
): Promise<ToolResult> {
    const validate = async (text: string) => {
        const fullText = existingPack ? `${existingPack}\n\n${text}` : text;
        return parsePackText(fullText);
    };

    if (name === 'validate_atlas') {
        console.log(`  [tool] validate_atlas — ${args.text.length} chars, starts: ${JSON.stringify(args.text.slice(0, 60))}`);
        const result = await validate(args.text);
        if (result.errors) {
            return { type: 'validate', valid: false, errors: result.errors };
        }
        console.log(`  [tool] validate_atlas — valid`);
        return { type: 'validate', valid: true };
    }

    if (name === 'submit_atlas') {
        console.log(`  [tool] submit_atlas — ${args.text.length} chars, starts: ${JSON.stringify(args.text.slice(0, 60))}`);
        const result = await validate(args.text);
        if (result.errors) {
            console.log(`  [tool] submit_atlas — invalid, rejecting`);
            return { type: 'reject', reason: `Submitted text is not valid — call validate_atlas first and fix all errors before submitting. Errors: ${result.errors.join('; ')}` };
        }
        console.log(`  [tool] submit_atlas — valid, submitting`);
        return { type: 'submit', text: args.text };
    }

    return { type: 'reject', reason: `Unknown tool: ${name}` };
}