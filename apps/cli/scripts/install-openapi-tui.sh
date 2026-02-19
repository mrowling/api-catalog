#!/bin/bash
set -e

# openapi-tui installation script
# Installs openapi-tui from GitHub releases

VERSION="0.10.2"
REPO="zaghaghi/openapi-tui"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Installing openapi-tui v${VERSION}..."

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map architecture names
case "$ARCH" in
    x86_64)
        RELEASE_ARCH="x86_64"
        ;;
    aarch64|arm64)
        RELEASE_ARCH="arm64"
        ;;
    *)
        echo -e "${RED}✗ Unsupported architecture: $ARCH${NC}"
        exit 1
        ;;
esac

# Map OS names and determine file extension
case "$OS" in
    linux)
        RELEASE_OS="linux"
        FILE_EXT="tar.gz"
        ;;
    darwin)
        RELEASE_OS="macos"
        FILE_EXT="tar.gz"
        ;;
    mingw*|msys*|cygwin*)
        echo -e "${YELLOW}⚠️  Windows detected. Please download manually from:${NC}"
        echo "https://github.com/${REPO}/releases/tag/${VERSION}"
        exit 1
        ;;
    *)
        echo -e "${RED}✗ Unsupported OS: $OS${NC}"
        exit 1
        ;;
esac

# Construct download URL using the actual naming convention
ARCHIVE_NAME="openapi-tui-${VERSION}-${RELEASE_OS}-${RELEASE_ARCH}.${FILE_EXT}"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${ARCHIVE_NAME}"

echo "📦 Downloading from: $DOWNLOAD_URL"

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Download the archive
if command -v curl &> /dev/null; then
    curl -L -o "$TEMP_DIR/$ARCHIVE_NAME" "$DOWNLOAD_URL"
elif command -v wget &> /dev/null; then
    wget -O "$TEMP_DIR/$ARCHIVE_NAME" "$DOWNLOAD_URL"
else
    echo -e "${RED}✗ Neither curl nor wget found. Please install one of them.${NC}"
    exit 1
fi

# Extract the archive
echo "📂 Extracting archive..."
cd "$TEMP_DIR"

if [ "$FILE_EXT" = "tar.gz" ]; then
    tar -xzf "$ARCHIVE_NAME"
elif [ "$FILE_EXT" = "zip" ]; then
    unzip -q "$ARCHIVE_NAME"
fi

# Find the binary
BINARY_PATH=$(find . -name "openapi-tui" -type f | head -n 1)

if [ -z "$BINARY_PATH" ]; then
    echo -e "${RED}✗ Binary not found in archive${NC}"
    exit 1
fi

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Install the binary
echo "📥 Installing to $INSTALL_DIR/openapi-tui..."
cp "$BINARY_PATH" "$INSTALL_DIR/openapi-tui"
chmod +x "$INSTALL_DIR/openapi-tui"

# Check if install directory is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo -e "${YELLOW}⚠️  $INSTALL_DIR is not in your PATH${NC}"
    echo ""
    echo "Add it to your PATH by adding this line to your shell profile:"
    echo ""
    echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
    echo ""
    
    # Detect shell and suggest appropriate file
    if [ -n "$BASH_VERSION" ]; then
        echo "For bash, add it to: ~/.bashrc or ~/.bash_profile"
    elif [ -n "$ZSH_VERSION" ]; then
        echo "For zsh, add it to: ~/.zshrc"
    else
        echo "Add it to your shell's profile file"
    fi
    echo ""
fi

# Verify installation
echo "🔍 Verifying installation..."
if "$INSTALL_DIR/openapi-tui" --version &> /dev/null; then
    VERSION_OUTPUT=$("$INSTALL_DIR/openapi-tui" --version)
    echo -e "${GREEN}✓ openapi-tui installed successfully!${NC}"
    echo -e "${GREEN}  $VERSION_OUTPUT${NC}"
    echo ""
    echo "Run: openapi-tui --help"
else
    echo -e "${YELLOW}⚠️  Binary installed but may not work on your system${NC}"
    echo ""
    echo "This can happen due to GLIBC version incompatibility."
    echo "Try installing with cargo instead:"
    echo ""
    echo "  cargo install openapi-tui"
    echo ""
    echo "Or use Homebrew on macOS:"
    echo "  brew install openapi-tui"
    exit 1
fi
