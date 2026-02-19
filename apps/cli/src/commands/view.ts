/**
 * View command - Display OpenAPI specs in a terminal UI using oq
 */

import { spawn, spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

/**
 * Check if oq binary is available in PATH
 */
function isOqInstalled(): boolean {
  const result = spawnSync('which', ['oq'], { encoding: 'utf8' });
  return result.status === 0;
}

/**
 * View an OpenAPI specification in a terminal UI
 * @param file - Optional file path, if not provided reads from stdin
 */
export async function viewCommand(file?: string) {
  // Check if oq is installed
  if (!isOqInstalled()) {
    console.error(chalk.red('Error: oq is not installed'));
    console.log(chalk.yellow('\nTo install oq:'));
    console.log(chalk.cyan('  Using Go:       go install github.com/plutov/oq@latest'));
    console.log(chalk.cyan('  Using Homebrew: brew install plutov/tap/oq'));
    console.log(chalk.cyan('  Using AUR:      yay -S oq-openapi-viewer-git'));
    console.log(chalk.yellow('\nFor more information, visit: https://github.com/plutov/oq'));
    process.exit(1);
  }

  let args: string[] = [];
  
  // If file is provided, validate and use it
  if (file) {
    // Resolve the file path
    const filePath = resolve(file);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      process.exit(1);
    }

    // Validate that the file is YAML or JSON
    if (!filePath.match(/\.(yaml|yml|json)$/i)) {
      console.error(chalk.red('Error: File must be a YAML (.yaml, .yml) or JSON (.json) file'));
      process.exit(1);
    }

    // Try to read the file to verify it's accessible
    try {
      readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(chalk.red(`Error: Cannot read file: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
    
    args = [filePath];
  }
  // Otherwise, oq will read from stdin

  // Spawn oq process
  const oqProcess = spawn('oq', args, {
    stdio: 'inherit', // Pass through stdin, stdout, stderr
    shell: false
  });

  // Handle process errors
  oqProcess.on('error', (error) => {
    console.error(chalk.red(`Failed to start oq: ${error.message}`));
    process.exit(1);
  });

  // Exit with the same code as oq
  oqProcess.on('close', (code) => {
    if (code !== null && code !== 0) {
      process.exit(code);
    }
  });
}

