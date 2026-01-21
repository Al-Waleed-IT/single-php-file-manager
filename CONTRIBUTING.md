# Contributing Guide

## Development Setup

1. Clone the repository
2. Download Vue 3 if not present:
   ```bash
   curl -sL https://unpkg.com/vue@3/dist/vue.global.prod.js -o src/js/vue.prod.js
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Start development server:
   ```bash
   ./start-dev.sh
   ```

## Project Architecture

### Backend (PHP)

The backend is modular with these components:

- **config.php** - Configuration constants
- **auth.php** - User authentication
- **filesystem.php** - File operations
- **archive.php** - Archive operations
- **api.php** - API endpoint routing

### Frontend (Vue 3)

- **app.js** - Main Vue application
- **vue.prod.js** - Vue 3 library (embedded)

### Styling

- **base.css** - Base styles and layout
- **components.css** - UI components

### Templates

- **login.html** - Login page
- **main.html** - Main application interface

## Adding New Features

### Example 1: Add a Copy File Function

#### 1. Add PHP function in `src/php/filesystem.php`:

```php
function copyItem($sourcePath, $destPath) {
    $fullSourcePath = getFullPath($sourcePath);
    $fullDestPath = getFullPath($destPath);

    if (!file_exists($fullSourcePath)) {
        throw new Exception('Source not found');
    }

    if (file_exists($fullDestPath)) {
        throw new Exception('Destination already exists');
    }

    if (is_dir($fullSourcePath)) {
        // Copy directory recursively
        mkdir($fullDestPath, 0755);
        $files = array_diff(scandir($fullSourcePath), array('.', '..'));
        foreach ($files as $file) {
            $src = $fullSourcePath . DIRECTORY_SEPARATOR . $file;
            $dst = $fullDestPath . DIRECTORY_SEPARATOR . $file;
            if (is_dir($src)) {
                copyItem($file, $dst);
            } else {
                copy($src, $dst);
            }
        }
    } else {
        if (!copy($fullSourcePath, $fullDestPath)) {
            throw new Exception('Failed to copy file');
        }
    }

    return true;
}
```

#### 2. Add API endpoint in `src/php/api.php`:

```php
case 'copy':
    $sourcePath = isset($_POST['sourcePath']) ? $_POST['sourcePath'] : '';
    $destPath = isset($_POST['destPath']) ? $_POST['destPath'] : '';
    copyItem($sourcePath, $destPath);
    echo json_encode(array('success' => true, 'message' => 'Copied'));
    break;
```

#### 3. Add Vue method in `src/js/app.js`:

```javascript
async copyItem(item) {
    const newName = prompt('Copy to:', item.name + '_copy');
    if (!newName) return;

    try {
        const formData = new FormData();
        formData.append('sourcePath', item.path);
        formData.append('destPath', this.currentPath + '/' + newName);
        const response = await fetch('?action=copy', { method: 'POST', body: formData });
        const data = await response.json();

        if (data.success) {
            this.showSuccess(data.message);
            this.loadDirectory();
        } else {
            this.error = data.error;
        }
    } catch (err) {
        this.error = 'Copy failed: ' + err.message;
    }
}
```

#### 4. Add button in `src/templates/main.html`:

```html
<button @click="copyItem(item)" class="action-btn action-blue">Copy</button>
```

#### 5. Rebuild:

```bash
npm run build
```

### Example 2: Add File Search Function

#### 1. Add PHP function in `src/php/filesystem.php`:

```php
function searchFiles($path, $query) {
    $fullPath = getFullPath($path);
    $results = array();

    if (!is_dir($fullPath)) {
        throw new Exception('Invalid directory');
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($fullPath)
    );

    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $filename = $file->getFilename();
            if (stripos($filename, $query) !== false) {
                $results[] = array(
                    'name' => $filename,
                    'path' => str_replace(BASE_DIR . DIRECTORY_SEPARATOR, '', $file->getPathname()),
                    'size' => $file->getSize(),
                    'modified' => $file->getMTime()
                );
            }
        }
    }

    return $results;
}
```

#### 2. Add API endpoint in `src/php/api.php`:

```php
case 'search':
    $path = isset($_POST['path']) ? $_POST['path'] : '';
    $query = isset($_POST['query']) ? $_POST['query'] : '';
    $results = searchFiles($path, $query);
    echo json_encode(array('success' => true, 'results' => $results));
    break;
```

#### 3. Add search to Vue app in `src/js/app.js`:

```javascript
data() {
    return {
        // ... existing data
        searchQuery: '',
        searchResults: null
    };
},

methods: {
    // ... existing methods

    async search() {
        if (!this.searchQuery.trim()) {
            this.searchResults = null;
            return;
        }

        try {
            const formData = new FormData();
            formData.append('path', this.currentPath);
            formData.append('query', this.searchQuery);
            const response = await fetch('?action=search', { method: 'POST', body: formData });
            const data = await response.json();

            if (data.success) {
                this.searchResults = data.results;
            } else {
                this.error = data.error;
            }
        } catch (err) {
            this.error = 'Search failed: ' + err.message;
        }
    }
}
```

#### 4. Add search UI in `src/templates/main.html`:

```html
<!-- Add after breadcrumb -->
<div class="container">
    <div class="search-bar">
        <input v-model="searchQuery"
               @input="search"
               type="text"
               placeholder="Search files..."
               class="input">
    </div>
    <div v-if="searchResults" class="search-results">
        <h3>Search Results ({{ searchResults.length }})</h3>
        <!-- Display search results -->
    </div>
</div>
```

## Code Style

### PHP
- Use 4 spaces for indentation
- Function names in camelCase
- Always throw exceptions for errors
- Return true on success

### JavaScript
- Use 4 spaces for indentation
- Use async/await for API calls
- Show user feedback for all operations
- Handle errors gracefully

### CSS
- Use utility-first approach
- Group related styles
- Comment sections clearly

## Testing

1. Test with multiple PHP versions:
   ```bash
   php5.6 -l dist/filemanager.php
   php7.4 -l dist/filemanager.php
   php8.2 -l dist/filemanager.php
   ```

2. Test all features:
   - Login/logout
   - Create files and directories
   - Upload files
   - Rename items
   - Delete items
   - View/edit files
   - Download files
   - Compress files
   - Extract archives
   - Change password

3. Test on different browsers:
   - Chrome
   - Firefox
   - Safari
   - Edge

## Build Process

The build script (`build.js`) performs these steps:

1. Reads all source files
2. Combines CSS modules
3. Replaces placeholders in templates
4. Assembles the final PHP file
5. Outputs to `dist/filemanager.php`

### Build Script Workflow

```
src/php/*.php  ─┐
src/js/*.js    ─┤
src/css/*.css  ─┼─> build.js ──> dist/filemanager.php
src/templates/ ─┘
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes in the `src/` directory
4. Test your changes: `npm run build && ./start-dev.sh`
5. Commit your changes: `git commit -m "Add my feature"`
6. Push to your fork: `git push origin feature/my-feature`
7. Create a Pull Request

## Questions?

Open an issue on GitHub with your question!
