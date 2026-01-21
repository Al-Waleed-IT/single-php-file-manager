// Archive Functions

function createZipArchive($sourcePath, $zipPath) {
    if (!class_exists('ZipArchive')) {
        throw new Exception('ZipArchive not available');
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new Exception('Cannot create zip file');
    }

    if (is_file($sourcePath)) {
        $zip->addFile($sourcePath, basename($sourcePath));
    } else {
        addDirectoryToZip($zip, $sourcePath, basename($sourcePath));
    }

    $zip->close();
    return true;
}

function addDirectoryToZip($zip, $dir, $zipDir = '') {
    $files = array_diff(scandir($dir), array('.', '..'));
    foreach ($files as $file) {
        $filePath = $dir . DIRECTORY_SEPARATOR . $file;
        $zipPath = $zipDir ? $zipDir . '/' . $file : $file;

        if (is_dir($filePath)) {
            $zip->addEmptyDir($zipPath);
            addDirectoryToZip($zip, $filePath, $zipPath);
        } else {
            $zip->addFile($filePath, $zipPath);
        }
    }
}

function createTarArchive($sourcePath, $tarPath, $compression = '') {
    if (!class_exists('PharData')) {
        throw new Exception('PharData not available');
    }

    $pharFile = $tarPath;
    if ($compression) {
        $pharFile = str_replace('.' . $compression, '', $tarPath);
    }

    $phar = new PharData($pharFile);

    if (is_file($sourcePath)) {
        $phar->addFile($sourcePath, basename($sourcePath));
    } else {
        $phar->buildFromDirectory($sourcePath);
    }

    if ($compression) {
        if ($compression === 'gz') {
            $phar->compress(Phar::GZ);
            unlink($pharFile);
        } elseif ($compression === 'bz2') {
            $phar->compress(Phar::BZ2);
            unlink($pharFile);
        }
    }

    return true;
}

function compressItem($path, $format) {
    $fullPath = getFullPath($path);

    if (!file_exists($fullPath)) {
        throw new Exception('Source not found');
    }

    $baseName = basename($fullPath);
    $parentDir = dirname($fullPath);
    $archiveName = $baseName . '.' . $format;
    $archivePath = $parentDir . DIRECTORY_SEPARATOR . $archiveName;

    // Avoid overwriting
    $counter = 1;
    while (file_exists($archivePath)) {
        $archiveName = $baseName . '_' . $counter . '.' . $format;
        $archivePath = $parentDir . DIRECTORY_SEPARATOR . $archiveName;
        $counter++;
    }

    if ($format === 'zip') {
        createZipArchive($fullPath, $archivePath);
    } elseif ($format === 'tar') {
        createTarArchive($fullPath, $archivePath);
    } elseif ($format === 'tar.gz') {
        createTarArchive($fullPath, $archivePath, 'gz');
    } elseif ($format === 'tar.bz2') {
        createTarArchive($fullPath, $archivePath, 'bz2');
    } else {
        throw new Exception('Unsupported format');
    }

    return $archiveName;
}

function extractArchive($archivePath, $extractTo) {
    $ext = strtolower(pathinfo($archivePath, PATHINFO_EXTENSION));

    if ($ext === 'zip') {
        return extractZip($archivePath, $extractTo);
    } elseif (in_array($ext, array('tar', 'gz', 'bz2', 'xz'))) {
        return extractTar($archivePath, $extractTo);
    } else {
        throw new Exception('Unsupported archive format');
    }
}

function extractZip($zipPath, $extractTo) {
    if (!class_exists('ZipArchive')) {
        throw new Exception('ZipArchive not available');
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath) !== true) {
        throw new Exception('Cannot open zip file');
    }

    $zip->extractTo($extractTo);
    $zip->close();
    return true;
}

function extractTar($tarPath, $extractTo) {
    if (!class_exists('PharData')) {
        throw new Exception('PharData not available');
    }

    try {
        $phar = new PharData($tarPath);
        $phar->extractTo($extractTo, null, true);
        return true;
    } catch (Exception $e) {
        throw new Exception('Failed to extract archive: ' . $e->getMessage());
    }
}

function extractItem($path) {
    $fullPath = getFullPath($path);

    if (!is_file($fullPath)) {
        throw new Exception('Archive not found');
    }

    $parentDir = dirname($fullPath);
    $baseName = pathinfo($fullPath, PATHINFO_FILENAME);

    // For .tar.gz, .tar.bz2, etc., get the base name without extensions
    if (preg_match('/\\.tar\\.(gz|bz2|xz)$/', basename($fullPath))) {
        $baseName = preg_replace('/\\.tar\\.(gz|bz2|xz)$/', '', basename($fullPath));
    }

    $extractPath = $parentDir . DIRECTORY_SEPARATOR . $baseName;

    // Avoid overwriting
    $counter = 1;
    while (file_exists($extractPath)) {
        $extractPath = $parentDir . DIRECTORY_SEPARATOR . $baseName . '_' . $counter;
        $counter++;
    }

    mkdir($extractPath, 0755);
    extractArchive($fullPath, $extractPath);

    return basename($extractPath);
}
