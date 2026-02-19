#!/usr/bin/env node
/**
 * Natural Language OpenAPI CLI
 * Command-line tool for generating and managing OpenAPI specifications
 */

import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { validateCommand } from './commands/validate.js';

const program = new Command();

program
  .name('nl-openapi')
  .description('Natural Language OpenAPI Specification Tool')
  .version('0.0.1');

program
  .command('generate')
  .description('Generate an OpenAPI specification from natural language')
  .argument('<description>', 'Natural language description of your API')
  .option('-o, --output <file>', 'Output file (defaults to stdout)')
  .option('-m, --model <model>', 'AI model to use (default: gpt-5-mini)')
  .action(generateCommand);

program
  .command('validate')
  .description('Validate an OpenAPI specification')
  .argument('<file>', 'Path to OpenAPI specification file')
  .action(validateCommand);

program.parse();
