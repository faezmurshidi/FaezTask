#!/bin/bash

# Setup script for task-master alias
# This script adds the tm alias to your shell configuration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAPPER_PATH="$SCRIPT_DIR/task-master-extended.js"

# Function to add alias to shell config
add_alias() {
    local shell_config="$1"
    local tm_alias="alias tm='node \"$WRAPPER_PATH\"'"
    
    if [ -f "$shell_config" ]; then
        # Check if tm alias already exists
        if grep -q "alias tm=" "$shell_config"; then
            echo "✅ Alias 'tm' already exists in $shell_config"
        else
            echo "$tm_alias" >> "$shell_config"
            echo "✅ Added alias 'tm' to $shell_config"
        fi
    fi
}

echo "🔧 Setting up task-master alias..."
echo "📍 Wrapper location: $WRAPPER_PATH"

# Detect shell and add alias
if [ -n "$ZSH_VERSION" ]; then
    # Zsh
    add_alias "$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    # Bash
    add_alias "$HOME/.bashrc"
    add_alias "$HOME/.bash_profile"
else
    echo "⚠️  Unknown shell. Please manually add this alias to your shell config:"
    echo "alias tm='node \"$WRAPPER_PATH\"'"
fi

echo ""
echo "🎉 Setup complete! Available commands:"
echo ""
echo "📋 Enhanced task-master (tm) - handles both regular and priority filtering:"
echo "   tm list                              # Regular list (full dashboard)"
echo "   tm list --priority high              # Priority filtering"
echo "   tm list --priority medium,low        # Multiple priorities"
echo "   tm list --priority high --status pending  # Combined filtering"
echo "   tm next                              # Regular commands work normally"
echo "   tm show 4                            # All original functionality"
echo "   tm set-status --id=5 --status=done   # Pass-through to task-master"
echo ""
echo "💡 Restart your terminal or run 'source ~/.zshrc' (or ~/.bashrc) to use the alias" 