#!/bin/bash

# Exit the script if any command fails
set -e

echo "Starting setup script..."

# Install Homebrew (if not already installed)
if ! command -v brew &>/dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "Homebrew is already installed."
fi

# Install nvm (if not already installed)
if [ ! -d "$HOME/.nvm" ]; then
  echo "Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  # Load nvm into the current shell session
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
else
  echo "nvm is already installed."
fi

# Ensure nvm is loaded for this session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check for .nvmrc and install the Node.js version specified
if [ -f ".nvmrc" ]; then
  NODE_VERSION=$(cat .nvmrc)
  echo "Installing Node.js version $NODE_VERSION from .nvmrc..."
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"
else
  echo ".nvmrc file not found. Please create one to specify the Node.js version."
  exit 1
fi

# Install Yarn (if not already installed)
if ! command -v yarn &>/dev/null; then
  echo "Installing Yarn..."
  npm install -g yarn
else
  echo "Yarn is already installed."
fi

# Run yarn install in the current project
echo "Running yarn install..."
yarn install

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    echo "Error: .env.example not found!"
    exit 1
fi

# Copy .env.example to .env.local if .env.local does not exist
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo ".env.local created from .env.example"
else
    echo ".env.local already exists. No changes made."
fi

echo "Setup complete!"
