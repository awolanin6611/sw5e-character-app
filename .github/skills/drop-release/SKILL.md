---
name: drop-release
description: "Use when: creating a new application release; pushing a version bump to GitHub; publishing new app binaries. Automates the full release pipeline: validates git state, stages changes (excluding PDFs to avoid GitHub limits), commits, bumps patch version, and pushes with tags to trigger GitHub Actions release workflow."
applyTo: "**"
---

# Drop a New Release

Automates the end-to-end release workflow for the SW5E Character App: commits pending changes, bumps the patch version, and pushes to GitHub to trigger the release build.

## When to Use

- User asks: "drop a new release", "push a new version", "create a release", "publish an update"
- Deploying features, bugfixes, or data updates
- Syncing app version with GitHub Releases for distribution

## Workflow

### 1. Check Release Preconditions
```powershell
git status --short
git branch --show-current
node -p "require('./package.json').version"
git tag --list "v*" --sort=-v:refname | Select-Object -First 3
```

**Purpose:** Verify working tree state, confirm main branch, check current version, and see recent release tags.

**Decision point:**
- If working tree is clean and on main → proceed directly to step 3
- If pending changes exist → proceed to step 2

### 2. Stage and Commit Changes
```powershell
git add -A -- . ":(exclude)data/*.pdf"
git commit -m "feat: [descriptive message]"
```

**Purpose:** Include all current work except large PDF files (which exceed GitHub's 100 MB push limit).

**Note:** Exclude `data/*.pdf` to prevent push rejections from oversized files.

### 3. Bump Patch Version
```powershell
npm version patch
```

**Purpose:** Increments patch version (e.g., 1.0.7 → 1.0.8), creates commit with version bump, and creates a Git tag (e.g., v1.0.8).

### 4. Push to GitHub
```powershell
git push origin main --follow-tags
```

**Purpose:** Push the release commit and version tag to origin. This triggers the GitHub Actions workflow defined in `.github/workflows/release.yml` to build and publish release assets.

## Success Criteria

- ✅ No push errors or rejections
- ✅ Main branch updated on GitHub
- ✅ New version tag (v1.0.X) visible on remote
- ✅ GitHub Actions release workflow started (check Actions tab)
- ✅ Release assets (Setup.exe, portable.exe) published to Releases page within minutes

## Error Handling

**Push rejected due to large files:**
- Verify `.gitignore` includes `data/*.pdf`
- Run: `git rm -r --cached data/*.pdf` to untrack any currently tracked PDFs
- Retry: `git push origin main --follow-tags`

**Release tag already exists (v1.0.X):**
- Check existing tags: `git tag --list "v*" --sort=-v:refname`
- If tag points to a different commit, delete locally: `git tag -d v1.0.X`
- Retry: `npm version patch` creates a new unique tag

**Package version out of sync with tags:**
- Current package version should match the most recent tag (minus the "v" prefix)
- If mismatched, run: `npm version patch` to bump and resync

## Output

After successful execution:
- New commit on main branch
- New version tag on GitHub
- GitHub Actions workflow running (check Actions tab)
- Installer assets published to GitHub Releases within 5–10 minutes

## Related Files

- `.github/workflows/release.yml` — GitHub Actions config that builds and publishes releases
- `.gitignore` — Ensures large PDFs are not committed
- `package.json` — Defines npm scripts and version bumping behavior
