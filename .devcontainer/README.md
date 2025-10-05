Best Solution: .git/info/exclude + Committed Template in Fork
Actually, the cleanest approach is:

Keep personal files untracked using .git/info/exclude:

bash# Edit .git/info/exclude (like .gitignore but local-only)
echo ".devcontainer/" >> .git/info/exclude
echo ".cursorrules" >> .git/info/exclude
echo ".claude/" >> .git/info/exclude

Store templates in your fork on a separate branch:

bashgit checkout -b my-dev-setup
# Add your files here as templates
git push origin my-dev-setup

One-time copy when starting new branch:

bashgit checkout -b feature/my-work upstream/main
git checkout my-dev-setup -- .devcontainer/ .cursorrules .claude/
# These files are now present but git-ignored locally
This keeps your working branches completely clean for upstream PRs while maintaining your personal setup.