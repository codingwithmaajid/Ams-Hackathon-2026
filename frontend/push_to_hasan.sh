#!/usr/bin/env bash
set -e

echo "=== Planning and Executing Push to GitHub ==="

# Get the current AMS directory and its parent
SOURCE_DIR=$(pwd)
PARENT_DIR=$(dirname "$SOURCE_DIR")
TEMP_REPO="$PARENT_DIR/ams-hackathon-temp"

echo "1. Going to parent directory..."
cd "$PARENT_DIR"

echo "2. Cleaning up any previous temp folders..."
rm -rf "$TEMP_REPO"

echo "3. Cloning the repository..."
git clone https://github.com/codingwithmaajid/Ams-Hackathon-2026.git "$TEMP_REPO"

echo "4. Entering the cloned repository..."
cd "$TEMP_REPO"

echo "5. Switching to branch 'hasan'..."
# Fetch all branches first
git fetch origin
# Check if branch exists remotely; if so checkout, otherwise create new
if git ls-remote --heads origin hasan | grep hasan > /dev/null; then
    git checkout hasan
else
    git checkout -b hasan
fi

echo "6. Creating frontend directory..."
mkdir -p frontend

echo "7. Copying files from AMS..."
# Enable dotglob to include hidden files (like .gitignore, .eslintrc etc) in the copy
shopt -s dotglob
cp -r "$SOURCE_DIR"/* frontend/
shopt -u dotglob

echo "8. Removing unnecessary files from the copy..."
rm -rf frontend/.git
rm -rf frontend/node_modules

echo "9. Staging and committing changes..."
git add .
git commit -m "feat: add frontend Vite application codebase" || echo "No new changes to commit."

echo "10. Pushing to branch 'hasan'..."
git push -u origin hasan

echo "=== All Done! Code successfully pushed. ==="
echo "You can safely delete the folder $TEMP_REPO if you want."
