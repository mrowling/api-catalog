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
 * Check if openapi-tui is installed
 */
function isOpenApiTuiInstalled(): boolean {
  try {
    execSync('which openapi-tui', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function openSpec(spec: OpenAPISpec, githubService: GitHubService): Promise<void> {
  const tuiInstalled = isOpenApiTuiInstalled();
  
  const choices = [
    { name: 'Open in $EDITOR', value: 'editor' },
    { 
      name: tuiInstalled ? 'Open in openapi-tui' : 'Open in openapi-tui (not installed)', 
      value: 'tui',
      disabled: !tuiInstalled ? 'Run: cargo install openapi-tui' : false
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
    case 'tui':
      await openInTui(content, spec);
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

async function openInTui(content: string, spec: OpenAPISpec): Promise<void> {
  // Double-check it's installed (in case user somehow got here)
  if (!isOpenApiTuiInstalled()) {
    console.log(chalk.yellow('\n⚠️  openapi-tui is not installed'));
    console.log(chalk.dim('\nTo install openapi-tui:'));
    console.log(chalk.cyan('\n  # Quick install (recommended)'));
    console.log(chalk.white('  bash scripts/install-openapi-tui.sh'));
    console.log(chalk.cyan('\n  # With Cargo (Rust)'));
    console.log(chalk.white('  cargo install openapi-tui'));
    console.log(chalk.cyan('\n  # On macOS with Homebrew'));
    console.log(chalk.white('  brew install openapi-tui'));
    console.log(chalk.cyan('\n  # On Arch Linux'));
    console.log(chalk.white('  yay -S openapi-tui'));
    console.log(chalk.dim('\nMore info: https://github.com/zaghaghi/openapi-tui'));
    
    const { installMethod } = await inquirer.prompt([
      {
        type: 'list',
        name: 'installMethod',
        message: 'Would you like to install it now?',
        choices: [
          { name: 'Yes, use quick install script', value: 'script' },
          { name: 'Yes, use cargo install', value: 'cargo' },
          { name: 'No, I\'ll install it manually', value: 'none' },
        ],
      },
    ]);

    if (installMethod === 'script') {
      const spinner = ora('Installing openapi-tui...').start();
      try {
        const scriptPath = join(__dirname, '../../scripts/install-openapi-tui.sh');
        execSync(`bash "${scriptPath}"`, { stdio: 'inherit' });
        spinner.succeed('openapi-tui installed successfully!');
        
        // Verify it actually works
        if (!isOpenApiTuiInstalled()) {
          spinner.warn('Installation completed but openapi-tui not found in PATH');
          console.log(chalk.yellow('\nYou may need to restart your terminal or add ~/.cargo/bin to your PATH'));
          return;
        }
      } catch (error) {
        spinner.fail('Installation failed');
        console.log(chalk.yellow('\n💡 See the error above for details.'));
        return;
      }
    } else if (installMethod === 'cargo') {
      const spinner = ora('Installing openapi-tui with cargo...').start();
      console.log(chalk.dim('\nThis will compile from source and may take a few minutes...'));
      try {
        // Use git version to avoid v0.10.2 release build bug
        execSync('cargo install openapi-tui --git https://github.com/zaghaghi/openapi-tui.git', { stdio: 'inherit' });
        spinner.succeed('openapi-tui installed successfully!');
      } catch (error) {
        spinner.fail('Failed to install with cargo');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : 'Unknown error');
        console.log(chalk.dim('\nMake sure you have Rust installed:'));
        console.log(chalk.white('  curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh'));
        return;
      }
    } else {
      return;
    }
  }

  const tempFile = join(tmpdir(), `${spec.repoName}-${spec.filePath.replace(/\//g, '-')}`);
  
  writeFileSync(tempFile, content);
  
  console.log(chalk.dim('\nOpening in openapi-tui...'));
  
  const tuiProcess = spawn('openapi-tui', [tempFile], {
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve, reject) => {
    tuiProcess.on('exit', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✓ openapi-tui closed'));
        resolve(null);
      } else {
        reject(new Error(`openapi-tui exited with code ${code}`));
      }
    });
    tuiProcess.on('error', (error) => {
      if ('code' in error && error.code === 'ENOENT') {
        console.error(chalk.red('\n✗ openapi-tui not found'));
        console.log(chalk.dim('Install it from: https://github.com/zaghaghi/openapi-tui'));
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
