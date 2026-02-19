/**
 * Utility to open OpenAPI specs in different ways
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { spawn, execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { OpenAPISpec, GitHubService } from '../services/github.js';

/**
 * Check if oq is installed
 */
function isOqInstalled(): boolean {
  try {
    execSync('which oq', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function openSpec(spec: OpenAPISpec, githubService: GitHubService): Promise<void> {
  const oqInstalled = isOqInstalled();
  
  const choices = [
    { name: 'Open in $EDITOR', value: 'editor' },
    { 
      name: oqInstalled ? 'Open in oq' : 'Open in oq (not installed)', 
      value: 'oq',
      disabled: !oqInstalled ? 'Run: go install github.com/plutov/oq@latest' : false
    },
    { name: 'Save to file', value: 'save' },
    { name: 'Print to console', value: 'print' },
  ];

  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'How would you like to open this spec?',
      choices,
    },
  ]);

  // Fetch the spec content
  const spinner = ora('Fetching spec content...').start();
  
  const [owner, repo] = spec.repoFullName.split('/');
  const content = await githubService.fetchSpecContent(owner, repo, spec.filePath);
  
  spinner.succeed('Spec fetched');

  switch (method) {
    case 'editor':
      await openInEditor(content, spec);
      break;
    case 'oq':
      await openInOq(content, spec);
      break;
    case 'save':
      await saveToFile(content, spec);
      break;
    case 'print':
      printToConsole(content);
      break;
  }
}

async function openInEditor(content: string, spec: OpenAPISpec): Promise<void> {
  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
  const tempFile = join(tmpdir(), `${spec.repoName}-${spec.filePath.replace(/\//g, '-')}`);
  
  writeFileSync(tempFile, content);
  
  console.log(chalk.dim(`\nOpening in ${editor}...`));
  
  const editorProcess = spawn(editor, [tempFile], {
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve, reject) => {
    editorProcess.on('exit', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✓ Editor closed'));
        resolve(null);
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
    editorProcess.on('error', reject);
  });
}

async function openInOq(content: string, spec: OpenAPISpec): Promise<void> {
  // Double-check it's installed (in case user somehow got here)
  if (!isOqInstalled()) {
    console.log(chalk.yellow('\n⚠️  oq is not installed'));
    console.log(chalk.dim('\nTo install oq:'));
    console.log(chalk.cyan('\n  # With Go'));
    console.log(chalk.white('  go install github.com/plutov/oq@latest'));
    console.log(chalk.cyan('\n  # With Homebrew (macOS/Linux)'));
    console.log(chalk.white('  brew install plutov/tap/oq'));
    console.log(chalk.cyan('\n  # On Arch Linux'));
    console.log(chalk.white('  yay -S oq-openapi-viewer-git'));
    console.log(chalk.dim('\nMore info: https://github.com/plutov/oq'));
    return;
  }

  const tempFile = join(tmpdir(), `${spec.repoName}-${spec.filePath.replace(/\//g, '-')}`);
  
  writeFileSync(tempFile, content);
  
  console.log(chalk.dim('\nOpening in oq...'));
  console.log(chalk.dim('Press ? for help, q to quit\n'));
  
  const oqProcess = spawn('oq', [tempFile], {
    stdio: 'inherit',
    shell: false,
  });

  await new Promise((resolve, reject) => {
    oqProcess.on('exit', (code) => {
      if (code === 0 || code === null) {
        console.log(chalk.green('\n✓ oq closed'));
        resolve(null);
      } else {
        reject(new Error(`oq exited with code ${code}`));
      }
    });
    oqProcess.on('error', (error) => {
      if ('code' in error && error.code === 'ENOENT') {
        console.error(chalk.red('\n✗ oq not found'));
        console.log(chalk.dim('Install it from: https://github.com/plutov/oq'));
        reject(error);
      } else {
        reject(error);
      }
    });
  });
}

async function saveToFile(content: string, spec: OpenAPISpec): Promise<void> {
  const { filepath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filepath',
      message: 'Enter file path to save:',
      default: spec.filePath.split('/').pop(),
    },
  ]);

  writeFileSync(filepath, content);
  console.log(chalk.green(`\n✓ Saved to ${filepath}`));
}

function printToConsole(content: string): void {
  console.log('\n' + chalk.cyan('─'.repeat(60)));
  console.log(content);
  console.log(chalk.cyan('─'.repeat(60)));
}
