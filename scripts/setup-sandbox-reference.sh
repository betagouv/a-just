#!/usr/bin/env bash
set -euo pipefail

# Purpose: Clone sandbox branch at current HEAD to create a frozen reference
# for pre-collecte-2026 baseline testing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REFERENCE_DIR="${REFERENCE_DIR:-$REPO_DIR/../a-just-sandbox-reference}"

echo "=== Setting up sandbox reference directory ==="
echo "Target: $REFERENCE_DIR"

# Check if reference directory already exists
if [ -d "$REFERENCE_DIR/.git" ]; then
  echo "✓ Reference directory already exists"
  cd "$REFERENCE_DIR"
  
  # Show current state
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  CURRENT_SHA=$(git rev-parse HEAD)
  echo "  Current branch: $CURRENT_BRANCH"
  echo "  Current commit: $CURRENT_SHA"
  
  # Check if there's a marker file
  if [ -f ".sandbox-reference-marker" ]; then
    FROZEN_SHA=$(cat .sandbox-reference-marker)
    echo "  Frozen at: $FROZEN_SHA"
    
    read -p "Do you want to update to latest sandbox HEAD? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "Updating to latest sandbox..."
      git fetch origin
      git checkout sandbox
      git pull origin sandbox
      NEW_SHA=$(git rev-parse HEAD)
      echo "$NEW_SHA" > .sandbox-reference-marker
      echo "✓ Updated to $NEW_SHA"
    else
      echo "Keeping existing reference"
    fi
  fi
else
  echo "Creating new reference directory..."
  
  # Get the remote URL from current repo
  cd "$REPO_DIR"
  REMOTE_URL=$(git config --get remote.origin.url)
  echo "  Cloning from: $REMOTE_URL"
  
  # Clone the repo
  git clone "$REMOTE_URL" "$REFERENCE_DIR"
  
  cd "$REFERENCE_DIR"
  
  # Checkout sandbox branch
  git checkout sandbox
  
  # Create marker file with current commit
  FROZEN_SHA=$(git rev-parse HEAD)
  echo "$FROZEN_SHA" > .sandbox-reference-marker
  
  echo "✓ Created reference at commit: $FROZEN_SHA"
  echo "✓ Marker file created: .sandbox-reference-marker"
fi

echo ""
echo "=== Reference directory ready ==="
echo "Path: $REFERENCE_DIR"
echo "To use in tests, set: export SANDBOX_CODE_DIR=\"$REFERENCE_DIR\""
