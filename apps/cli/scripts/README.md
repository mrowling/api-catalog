# openapi-tui Installation Script

This script automatically downloads and installs [openapi-tui](https://github.com/zaghaghi/openapi-tui) from GitHub releases.

## Quick Start

```bash
bash scripts/install-openapi-tui.sh
```

## What It Does

1. Detects your OS (Linux or macOS) and architecture (x86_64 or ARM64)
2. Downloads the appropriate pre-built binary from GitHub releases (v0.10.2)
3. Extracts and installs to `~/.local/bin/openapi-tui`
4. Makes the binary executable
5. Verifies the installation

## Requirements

- `curl` or `wget` (for downloading)
- `tar` (for extracting)
- Linux or macOS

## Custom Install Location

Set the `INSTALL_DIR` environment variable:

```bash
INSTALL_DIR=/usr/local/bin bash scripts/install-openapi-tui.sh
```

## Troubleshooting

### "GLIBC version not found"

The pre-built binary may not work on your system if you have an older GLIBC version. Install with cargo instead:

```bash
cargo install openapi-tui
```

### "Not in PATH"

If `~/.local/bin` is not in your PATH, add it to your shell profile:

```bash
# For bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc

# For zsh
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc
```

Then restart your terminal or run:

```bash
source ~/.bashrc  # or ~/.zshrc
```

## Alternative Installation Methods

### Cargo (Rust)

```bash
cargo install openapi-tui
```

### Homebrew (macOS)

```bash
brew install openapi-tui
```

### Arch Linux

```bash
yay -S openapi-tui
```

## More Information

Visit the official repository: https://github.com/zaghaghi/openapi-tui
