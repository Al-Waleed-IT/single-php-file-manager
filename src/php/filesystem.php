// Filesystem Functions

function sanitizePath($path) {
    $path = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $path);
    $path = str_replace('..', '', $path);
    return $path;
}

function getFullPath($relativePath) {
    return BASE_DIR . DIRECTORY_SEPARATOR . sanitizePath($relativePath);
}

function rmdirRecursive($dir) {
    if (!is_dir($dir)) return false;
    $files = array_diff(scandir($dir), array('.', '..'));
    foreach ($files as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        is_dir($path) ? rmdirRecursive($path) : unlink($path);
    }
    return rmdir($dir);
}

function listDirectory($path) {
    $fullPath = getFullPath($path);

    if (!is_dir($fullPath)) {
        throw new Exception('Invalid directory');
    }

    $items = array();
    $files = scandir($fullPath);

    foreach ($files as $file) {
        if ($file === '.' || ($file === '..' && empty($path)) || $file === '.users.json') {
            continue;
        }

        $itemPath = $fullPath . DIRECTORY_SEPARATOR . $file;
        $relativePath = empty($path) ? $file : $path . DIRECTORY_SEPARATOR . $file;

        $item = array(
            'name' => $file,
            'path' => $relativePath,
            'type' => is_dir($itemPath) ? 'directory' : 'file',
            'size' => is_file($itemPath) ? filesize($itemPath) : 0,
            'modified' => filemtime($itemPath),
            'readable' => is_readable($itemPath),
            'writable' => is_writable($itemPath)
        );

        $items[] = $item;
    }

    return $items;
}

function uploadFile($path, $file) {
    $fullPath = getFullPath($path);

    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload error: ' . $file['error']);
    }

    if ($file['size'] > MAX_UPLOAD_SIZE) {
        throw new Exception('File too large');
    }

    $targetPath = $fullPath . DIRECTORY_SEPARATOR . basename($file['name']);

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to save file');
    }

    return true;
}

function deleteItem($path) {
    $fullPath = getFullPath($path);

    if (!file_exists($fullPath)) {
        throw new Exception('File not found');
    }

    if (is_dir($fullPath)) {
        if (!rmdirRecursive($fullPath)) {
            throw new Exception('Failed to delete directory');
        }
    } else {
        if (!unlink($fullPath)) {
            throw new Exception('Failed to delete file');
        }
    }

    return true;
}

function renameItem($oldPath, $newName) {
    $fullOldPath = getFullPath($oldPath);
    $dir = dirname($fullOldPath);
    $fullNewPath = $dir . DIRECTORY_SEPARATOR . basename($newName);

    if (!file_exists($fullOldPath)) {
        throw new Exception('File not found');
    }

    if (file_exists($fullNewPath)) {
        throw new Exception('Target already exists');
    }

    if (!rename($fullOldPath, $fullNewPath)) {
        throw new Exception('Failed to rename');
    }

    return true;
}

function createItem($path, $name, $type) {
    $basePath = getFullPath($path);
    $newPath = $basePath . DIRECTORY_SEPARATOR . basename($name);

    if (file_exists($newPath)) {
        throw new Exception('Already exists');
    }

    if ($type === 'directory') {
        if (!mkdir($newPath, 0755)) {
            throw new Exception('Failed to create directory');
        }
    } else {
        if (file_put_contents($newPath, '') === false) {
            throw new Exception('Failed to create file');
        }
    }

    return true;
}

function readFileContent($path) {
    $fullPath = getFullPath($path);

    if (!is_file($fullPath)) {
        throw new Exception('Not a file');
    }

    if (filesize($fullPath) > 1024 * 1024) {
        throw new Exception('File too large to preview');
    }

    return file_get_contents($fullPath);
}

function writeFile($path, $content) {
    $fullPath = getFullPath($path);

    if (file_put_contents($fullPath, $content) === false) {
        throw new Exception('Failed to write file');
    }

    return true;
}

function downloadFile($path) {
    $fullPath = getFullPath($path);

    if (!is_file($fullPath)) {
        throw new Exception('File not found');
    }

    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($fullPath) . '"');
    header('Content-Length: ' . filesize($fullPath));
    readfile($fullPath);
    exit;
}
