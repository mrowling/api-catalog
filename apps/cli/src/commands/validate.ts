/**
 * Validate command - Validate an OpenAPI specification
 */

import * as fs from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { validationService } from '@ai-openapi/shared';

export async function validateCommand(file: string) {
  const spinner = ora(`Validating ${file}...`).start();

  try {
    // Read file
    const content = await fs.readFile(file, 'utf-8');

    // Validate
    const result = await validationService.validate(content);

    if (result.valid) {
      spinner.succeed(`${file} is valid!`);
      console.log(chalk.green(`\n✓ OpenAPI ${result.version} specification is valid`));
    } else {
      spinner.fail(`${file} has validation errors`);
      console.log(chalk.red(`\n✗ Found ${result.errors.length} error(s):\n`));
      
      result.errors.forEach((error, index) => {
        console.log(chalk.yellow(`${index + 1}. ${error}`));
      });
      
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Validation failed');
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
