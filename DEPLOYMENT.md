# 🚀 Deployment Guide

## GitHub Repository Setup

### 1. Initialize Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: PHP File Manager v1.0.0"

# Add remote repository
git remote add origin https://github.com/Al-Waleed-IT/single-php-file-manager.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2. GitHub Actions Setup

The repository includes two GitHub Actions workflows:

#### Release Workflow (`.github/workflows/release.yml`)
- **Triggers**: Automatically on push to `main` branch
- **Actions**:
  - Downloads Vue 3
  - Builds the project
  - Generates version tag (format: `v1.YYYY.MMDD.COMMIT_COUNT`)
  - Creates GitHub release
  - Uploads `filemanager.php` as release asset
  - Updates CHANGELOG.md
  - Generates release notes

#### Test Workflow (`.github/workflows/test.yml`)
- **Triggers**: On pull requests and non-main branch pushes
- **Actions**:
  - Tests build on PHP 5.6, 7.4, 8.0, 8.2
  - Verifies PHP syntax
  - Checks file size
  - Uploads build artifacts

### 3. First Release

After pushing to GitHub:

1. GitHub Actions will automatically trigger
2. Check Actions tab: `https://github.com/Al-Waleed-IT/single-php-file-manager/actions`
3. Wait for workflow to complete
4. Release will appear at: `https://github.com/Al-Waleed-IT/single-php-file-manager/releases`

### 4. Versioning Strategy

**Automatic Versioning Format**: `v1.YYYY.MMDD.N`

- `v1` - Major version
- `YYYY` - Year
- `MMDD` - Month and day
- `N` - Number of commits (auto-incremented)

**Example**: `v1.2024.0115.42`
- Version 1
- Built on January 15, 2024
- 42nd commit

### 5. Manual Workflow Trigger

You can also manually trigger a release:

1. Go to Actions tab
2. Select "Build and Release" workflow
3. Click "Run workflow"
4. Choose branch (main)
5. Click "Run workflow"

## Production Deployment

### Option 1: Download from GitHub Releases (Recommended)

```bash
# Download latest release
wget https://github.com/Al-Waleed-IT/single-php-file-manager/releases/latest/download/filemanager.php

# Or use curl
curl -L https://github.com/Al-Waleed-IT/single-php-file-manager/releases/latest/download/filemanager.php -o filemanager.php

# Upload to your server
scp filemanager.php user@yourserver:/var/www/html/

# Set permissions
ssh user@yourserver "chmod 644 /var/www/html/filemanager.php"
```

### Option 2: Build from Source

```bash
# Clone repository
git clone https://github.com/Al-Waleed-IT/single-php-file-manager.git
cd single-php-file-manager

# Download Vue 3
curl -sL https://unpkg.com/vue@3/dist/vue.global.prod.js -o src/js/vue.prod.js

# Build
npm run build

# Deploy
scp dist/filemanager.php user@yourserver:/var/www/html/
```

### Option 3: Direct Upload

1. Go to [Releases](https://github.com/Al-Waleed-IT/single-php-file-manager/releases/latest)
2. Download `filemanager.php`
3. Upload via FTP/SFTP to your server
4. Access via browser: `https://yourserver.com/filemanager.php`

## Server Configuration

### Apache (.htaccess)

```apache
# Protect users file
<Files .users.json>
    Order allow,deny
    Deny from all
</Files>

# PHP settings
php_value upload_max_filesize 100M
php_value post_max_size 100M
php_value max_execution_time 300
php_value max_input_time 300
```

### Nginx

```nginx
location ~ /\.users\.json$ {
    deny all;
    return 404;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;

    # Increase limits for file uploads
    client_max_body_size 100M;
    fastcgi_read_timeout 300;
}
```

### PHP Configuration (php.ini)

```ini
upload_max_filesize = 100M
post_max_size = 100M
max_execution_time = 300
max_input_time = 300
memory_limit = 256M

# Required extensions
extension=zip
extension=phar
```

## Security Hardening

### 1. Change Default Password

**IMMEDIATELY** after first login:
1. Click "🔑 Password" button
2. Enter current password: `admin`
3. Set a strong new password
4. Confirm and save

### 2. Restrict Access

#### IP Whitelist (.htaccess)
```apache
<Files filemanager.php>
    Order Deny,Allow
    Deny from all
    Allow from 192.168.1.0/24
    Allow from YOUR_IP_ADDRESS
</Files>
```

#### Basic Auth (.htaccess)
```apache
<Files filemanager.php>
    AuthType Basic
    AuthName "Restricted Area"
    AuthUserFile /path/to/.htpasswd
    Require valid-user
</Files>
```

### 3. SSL/TLS

Always use HTTPS:
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^filemanager\.php$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 4. File Permissions

```bash
# Correct permissions
chmod 644 filemanager.php
chmod 600 .users.json  # (if exists)
chmod 755 /path/to/directory
```

### 5. Disable Directory Listing

```apache
Options -Indexes
```

## Monitoring & Maintenance

### Check for Updates

```bash
# Check latest release
curl -s https://api.github.com/repos/Al-Waleed-IT/single-php-file-manager/releases/latest | grep "tag_name"

# Download and update
wget -O filemanager.php https://github.com/Al-Waleed-IT/single-php-file-manager/releases/latest/download/filemanager.php
```

### Backup Users File

```bash
# Backup .users.json regularly
cp .users.json .users.json.backup
```

### Log Monitoring

Monitor PHP error logs:
```bash
tail -f /var/log/php/error.log
```

## Troubleshooting

### GitHub Actions Failing

1. Check workflow logs in Actions tab
2. Verify Vue 3 download succeeded
3. Ensure PHP syntax is valid
4. Check file permissions

### Release Not Created

- Ensure push is to `main` branch
- Check if tag already exists
- Verify GitHub token permissions
- Review workflow logs for errors

### Build File Too Large

- Check Vue 3 is properly minified
- Verify no duplicate code
- Review source file sizes

## Continuous Integration

### Automated Testing on PR

When creating a pull request:
1. GitHub Actions runs test workflow
2. Tests build on multiple PHP versions
3. Verifies syntax and size
4. Uploads artifact for manual testing

### Release Process

1. **Develop**: Make changes in `src/` directory
2. **Commit**: `git commit -m "feat: Add new feature"`
3. **Push**: `git push origin feature-branch`
4. **PR**: Create pull request to `main`
5. **Test**: Wait for automated tests to pass
6. **Merge**: Merge PR to `main`
7. **Release**: Automatic release triggered
8. **Download**: New version available in releases

## Rollback

If a release has issues:

```bash
# Download specific version
wget https://github.com/Al-Waleed-IT/single-php-file-manager/releases/download/v1.2024.0115.42/filemanager.php

# Or revert to previous commit
git revert <commit-hash>
git push origin main
```

## Support

- 📖 [Documentation](https://github.com/Al-Waleed-IT/single-php-file-manager)
- 🐛 [Report Issues](https://github.com/Al-Waleed-IT/single-php-file-manager/issues)
- 💬 [Discussions](https://github.com/Al-Waleed-IT/single-php-file-manager/discussions)
