#!/usr/bin/env node
/**
 * Natural Language OpenAPI CLI
 * Command-line tool for generating and managing OpenAPI specifications
 */

import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { validateCommand } from './commands/validate.js';
import { browseCommand } from './commands/browse.js';
import { listCommand } from './commands/list.js';
import { openCommand } from './commands/open.js';

const program = new Command();

program
  .name('nl-openapi')
  .description('Natural Language OpenAPI Specification Tool')
  .version('0.0.1');

// Generate command
program
  .command('generate')
  .description('Generate an OpenAPI specification from natural language')
  .argument('<description>', 'Natural language description of your API')
  .option('-o, --output <file>', 'Output file (defaults to stdout)')
  .option('-m, --model <model>', 'AI model to use (default: gpt-5-mini)')
  .action(generateCommand);

// Validate command
program
  .command('validate')
  .description('Validate an OpenAPI specification')
  .argument('<file>', 'Path to OpenAPI specification file')
  .action(validateCommand);

// Browse command (interactive)
program
  .command('browse')
  .description('Browse OpenAPI specs in GitHub organizations (interactive)')
  .action(browseCommand);

// List command
program
  .command('list')
  .description('List OpenAPI specs in a GitHub organization')
  .argument('<org>', 'GitHub organization name')
  .action(listCommand);

// Open command
program
  .command('open')
  .description('Open a specific OpenAPI spec from a GitHub organization')
  .argument('<org>', 'GitHub organization name')
  .argument('<index>', 'Spec index from list command (1-based)')
  .action(openCommand);

program.parse();
