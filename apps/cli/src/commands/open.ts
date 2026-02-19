/**
 * Open command - Open a specific OpenAPI spec from a GitHub organization
 */

import chalk from 'chalk';
import ora from 'ora';
import { GitHubService } from '../services/github.js';
import { openSpec } from '../utils/opener.js';

export async function openCommand(org: string, indexStr: string) {
  try {
    const index = parseInt(indexStr, 10);
    
    if (isNaN(index) || index < 1) {
      console.error(chalk.red('Error: Index must be a positive number'));
      process.exit(1);
    }

    const spinner = ora(`Searching for OpenAPI specs in ${org}...`).start();
    
    const githubService = new GitHubService();
    const result = await githubService.searchOpenAPISpecs(org);
    
    if (result.specs.length === 0) {
      spinner.fail(`No OpenAPI specs found in ${org}`);
      process.exit(1);
    }

    if (index > result.specs.length) {
      spinner.fail(`Index ${index} is out of range (1-${result.specs.length})`);
      process.exit(1);
    }

    const selectedSpec = result.specs[index - 1];
    spinner.succeed(`Selected: ${selectedSpec.repoName} - ${selectedSpec.filePath}`);

    await openSpec(selectedSpec, githubService);
  } catch (error) {
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
