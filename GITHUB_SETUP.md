# 🚀 GitHub Setup Guide

## Quick Start (5 minutes)

### 1. Create GitHub Repository

Go to: https://github.com/new

- Repository name: `single-php-file-manager`
- Description: "Modular PHP File Manager - Single file distribution"
- Visibility: Public
- **DO NOT** initialize with README, .gitignore, or license (we already have them)
- Click "Create repository"

### 2. Initialize Local Repository

```bash
cd /home/touhid/www/file-manager.local

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: PHP File Manager v1.0.0

✨ Features:
- Modular PHP file manager with Vue 3
- BCrypt authentication (12 rounds)
- Complete file management (upload, download, edit, delete)
- Archive support (ZIP, TAR, GZ, BZ2, XZ)
- Responsive design
- GitHub Actions CI/CD
- Automated releases with versioning"

# Add remote
git remote add origin https://github.com/Al-Waleed-IT/single-php-file-manager.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

### 3. Verify GitHub Actions

1. Go to: https://github.com/Al-Waleed-IT/single-php-file-manager/actions
2. You should see "Build and Release" workflow running
3. Wait for it to complete (2-3 minutes)
4. Check releases: https://github.com/Al-Waleed-IT/single-php-file-manager/releases

### 4. Success! 🎉

Your first release should be available at:
```
https://github.com/Al-Waleed-IT/single-php-file-manager/releases/latest
```

Version format: `v1.2024.0121.1` (Year.MonthDay.CommitCount)

---

## Automated Features

### Every Commit to Main:
✅ Automatic build
✅ Version tag creation
✅ GitHub release
✅ CHANGELOG.md update
✅ filemanager.php uploaded as asset

### Every Pull Request:
✅ Test on PHP 5.6, 7.4, 8.0, 8.2
✅ Syntax validation
✅ Build artifact upload

---

## Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes in src/ directory
# Edit src/php/*, src/js/*, src/css/*, etc.

# 3. Test locally
npm run build
npm run test

# 4. Commit changes
git add .
git commit -m "feat: Add awesome feature"

# 5. Push to GitHub
git push origin feature/my-feature

# 6. Create Pull Request on GitHub
# PR tests will run automatically

# 7. Merge PR
# Automatic release will be created!
```

---

## Version Format

**Pattern**: `v1.YYYY.MMDD.N`

- `v1` - Major version
- `YYYY` - Year (2024)
- `MMDD` - Month and day (0121 = January 21)
- `N` - Commit count (increments automatically)

**Example**: `v1.2024.0121.42`
- Version 1
- Built: January 21, 2024
- 42nd commit

---

## Downloading Releases

### Latest Release
```bash
wget https://github.com/Al-Waleed-IT/single-php-file-manager/releases/latest/download/filemanager.php
```

### Specific Version
```bash
wget https://github.com/Al-Waleed-IT/single-php-file-manager/releases/download/v1.2024.0121.1/filemanager.php
```

---

## Repository Settings

### Enable Features
1. Go to: Settings → General
2. Enable:
   - ✅ Issues
   - ✅ Discussions
   - ✅ Wikis (optional)

### Branch Protection
1. Go to: Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

---

## Troubleshooting

### GitHub Actions Not Running
- Check repository settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is enabled

### Release Not Created
- Check Actions tab for errors
- Verify push is to `main` branch
- Check if tag already exists

### Build Fails
- Ensure Vue 3 download succeeded
- Check PHP syntax: `php -l dist/filemanager.php`
- Review workflow logs in Actions tab

---

## Useful Links

📦 Repository: https://github.com/Al-Waleed-IT/single-php-file-manager
🚀 Releases: https://github.com/Al-Waleed-IT/single-php-file-manager/releases
⚙️ Actions: https://github.com/Al-Waleed-IT/single-php-file-manager/actions
🐛 Issues: https://github.com/Al-Waleed-IT/single-php-file-manager/issues
💬 Discussions: https://github.com/Al-Waleed-IT/single-php-file-manager/discussions

---

## Next Steps

After setup:
1. ⭐ Star the repository
2. 👀 Watch for updates
3. 📢 Share with others
4. 🤝 Contribute improvements
5. 📝 Report bugs/suggestions

**Happy coding! 🎉**
