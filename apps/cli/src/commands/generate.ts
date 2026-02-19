/**
 * Generate command - Create OpenAPI spec from natural language
 */

import * as fs from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { AIProviderFactory, type AIMessage } from '@ai-openapi/shared';

const SYSTEM_PROMPT = `You are an expert at creating OpenAPI 3.1 specifications.

Your task is to generate valid, well-structured OpenAPI 3.1 specifications based on the user's description.

Guidelines:
- Always use OpenAPI 3.1.0 format
- Include all required fields: openapi, info (title, version), paths
- Use clear, descriptive titles and descriptions
- Follow REST API best practices
- Include appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Define request bodies and responses with proper schemas
- Use standard HTTP status codes
- Include examples where appropriate
- Use kebab-case for paths
- Use camelCase for property names in schemas

Return ONLY the OpenAPI specification in YAML format. Do not include any explanations or markdown code blocks.`;

export async function generateCommand(
  description: string,
  options: { output?: string; model?: string }
) {
  const spinner = ora('Generating OpenAPI specification...').start();

  try {
    // Get AI provider
    const provider = AIProviderFactory.getProvider({
      defaultModel: options.model,
    });

    // Prepare messages
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: description,
      },
    ];

    // Generate spec
    const result = await provider.complete(messages, {
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Clean up the response (remove markdown code blocks if present)
    let spec = result.content.trim();
    spec = spec.replace(/^```ya?ml\n/i, '');
    spec = spec.replace(/\n```$/, '');
    spec = spec.trim();

    // Validate it starts with openapi
    if (!spec.startsWith('openapi:')) {
      spinner.fail('Generated content does not appear to be a valid OpenAPI spec');
      process.exit(1);
    }

    spinner.succeed('OpenAPI specification generated successfully!');

    // Output
    if (options.output) {
      await fs.writeFile(options.output, spec, 'utf-8');
      console.log(chalk.green(`\n✓ Saved to ${options.output}`));
    } else {
      console.log('\n' + chalk.cyan('─'.repeat(60)));
      console.log(spec);
      console.log(chalk.cyan('─'.repeat(60)));
    }

    console.log(chalk.dim(`\nModel: ${result.model}`));
  } catch (error) {
    spinner.fail('Failed to generate OpenAPI specification');
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
