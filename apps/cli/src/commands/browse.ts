/**
 * Browse command - Interactive discovery of OpenAPI specs in GitHub orgs
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitHubService, type OpenAPISpec } from '../services/github.js';
import { openSpec } from '../utils/opener.js';

export async function browseCommand() {
  const githubService = new GitHubService();
  let currentOrg: string | null = null;
  let currentResult: { specs: OpenAPISpec[]; totalCount: number; lastUpdated: string } | null = null;

  while (true) {
    try {
      // Ask for organization (or use current one)
      if (!currentOrg) {
        const { org } = await inquirer.prompt([
          {
            type: 'input',
            name: 'org',
            message: 'Enter GitHub organization name:',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Organization name is required';
              }
              return true;
            },
          },
        ]);
        currentOrg = org;
      }

      // Search for specs (or use cached result)
      if (!currentResult) {
        const spinner = ora(`Searching for OpenAPI specs in ${currentOrg}...`).start();
        
        currentResult = await githubService.searchOpenAPISpecs(currentOrg!);
        
        if (currentResult.specs.length === 0) {
          spinner.warn(`No OpenAPI specs found in ${currentOrg}`);
          currentOrg = null;
          currentResult = null;
          
          const { tryAgain } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'tryAgain',
              message: 'Would you like to search another organization?',
              default: true,
            },
          ]);
          
          if (!tryAgain) {
            return;
          }
          continue;
        }

        spinner.succeed(`Found ${currentResult.specs.length} spec(s) in ${currentOrg}`);
      }

      // Let user select a spec or action
      const choices = [
        ...currentResult.specs.map((spec, index) => ({
          name: `${index + 1}. ${spec.repoName} - ${spec.filePath}`,
          value: { type: 'spec', spec },
        })),
        new inquirer.Separator(),
        { name: '↻ Refresh results', value: { type: 'refresh' } },
        { name: '🔍 Search another organization', value: { type: 'new-org' } },
        { name: '✕ Exit', value: { type: 'exit' } },
      ];

      const { selected } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selected',
          message: 'Select an option:',
          choices,
          pageSize: 20,
        },
      ]);

      if (selected.type === 'spec') {
        // Ask how to open
        await openSpec(selected.spec, githubService);
        // Continue to menu after opening
        continue;
      } else if (selected.type === 'refresh') {
        // Clear cache and refresh
        const spinner = ora(`Refreshing specs for ${currentOrg}...`).start();
        currentResult = await githubService.searchOpenAPISpecs(currentOrg!, true);
        spinner.succeed(`Found ${currentResult.specs.length} spec(s) in ${currentOrg}`);
        continue;
      } else if (selected.type === 'new-org') {
        // Reset to search new org
        currentOrg = null;
        currentResult = null;
        continue;
      } else if (selected.type === 'exit') {
        console.log(chalk.dim('\nGoodbye! 👋'));
        return;
      }
    } catch (error) {
      if ((error as any).isTtyError) {
        // Prompt couldn't be rendered in the current environment
        console.error(chalk.red('\nError: Interactive prompts not supported in this environment'));
        process.exit(1);
      } else if ((error as any).name === 'ExitPromptError') {
        // User pressed Ctrl+C
        console.log(chalk.dim('\n\nGoodbye! 👋'));
        process.exit(0);
      } else {
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    }
  }
}
