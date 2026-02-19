/**
 * List command - List OpenAPI specs in a GitHub organization
 */

import chalk from 'chalk';
import ora from 'ora';
import { GitHubService } from '../services/github.js';

export async function listCommand(org: string) {
  try {
    const spinner = ora(`Searching for OpenAPI specs in ${org}...`).start();
    
    const githubService = new GitHubService();
    const result = await githubService.searchOpenAPISpecs(org);
    
    if (result.specs.length === 0) {
      spinner.warn(`No OpenAPI specs found in ${org}`);
      return;
    }

    spinner.succeed(`Found ${result.specs.length} spec(s) in ${org}`);

    console.log('\n' + chalk.bold('OpenAPI Specifications:'));
    console.log(chalk.dim('─'.repeat(80)) + '\n');

    result.specs.forEach((spec, index) => {
      console.log(chalk.cyan(`${index + 1}.`) + ` ${chalk.bold(spec.repoName)}`);
      console.log(chalk.dim(`   ${spec.filePath}`));
      console.log(chalk.dim(`   ${spec.htmlUrl}`));
      console.log();
    });

    console.log(chalk.dim('─'.repeat(80)));
    console.log(chalk.dim(`\nTip: Use ${chalk.white('nl-openapi open <org> <index>')} to open a spec`));
  } catch (error) {
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
