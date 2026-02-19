#!/bin/bash
set -e

# openapi-tui installation script
# Installs openapi-tui using cargo from git (v0.10.2 release has build issues)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Installing openapi-tui..."

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}✗ cargo not found${NC}"
    echo ""
    echo "openapi-tui requires Rust and Cargo to build from source."
    echo ""
    echo "Install Rust:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "📦 Installing openapi-tui from git..."
echo "   This will compile from source and may take a few minutes..."
echo ""

# Install from git (avoids the v0.10.2 release build bug)
if cargo install openapi-tui --git https://github.com/zaghaghi/openapi-tui.git; then
    echo ""
    echo -e "${GREEN}✓ openapi-tui installed successfully!${NC}"
    echo ""
    echo "Run: openapi-tui --help"
else
    echo ""
    echo -e "${RED}✗ Installation failed${NC}"
    echo ""
    echo "Try installing manually:"
    echo "  cargo install openapi-tui --git https://github.com/zaghaghi/openapi-tui.git"
    exit 1
fi
