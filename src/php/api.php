// API Handler

if (isset($_GET['action'])) {
    $action = $_GET['action'];

    // Login endpoint
    if ($action === 'login') {
        header('Content-Type: application/json');
        $username = isset($_POST['username']) ? $_POST['username'] : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';

        if (verifyLogin($username, $password)) {
            $_SESSION['authenticated'] = true;
            $_SESSION['username'] = $username;
            echo json_encode(array('success' => true));
        } else {
            echo json_encode(array('success' => false, 'error' => 'Invalid credentials'));
        }
        exit;
    }

    // Logout endpoint
    if ($action === 'logout') {
        session_destroy();
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;
    }

    // All other actions require authentication
    if (!isAuthenticated()) {
        header('Content-Type: application/json');
        echo json_encode(array('success' => false, 'error' => 'Not authenticated'));
        exit;
    }

    header('Content-Type: application/json');

    try {
        switch ($action) {
            case 'list':
                $path = isset($_POST['path']) ? $_POST['path'] : '';
                $items = listDirectory($path);
                echo json_encode(array('success' => true, 'items' => $items, 'current' => $path));
                break;

            case 'upload':
                $path = isset($_POST['path']) ? $_POST['path'] : '';
                if (!isset($_FILES['file'])) {
                    throw new Exception('No file uploaded');
                }
                uploadFile($path, $_FILES['file']);
                echo json_encode(array('success' => true, 'message' => 'File uploaded'));
                break;

            case 'delete':
                $path = isset($_POST['path']) ? $_POST['path'] : '';
                deleteItem($path);
                echo json_encode(array('success' => true, 'message' => 'Deleted'));
                break;

            case 'rename':
                $oldPath = isset($_POST['oldPath']) ? $_POST['oldPath'] : '';
                $newName = isset($_POST['newName']) ? $_POST['newName'] : '';
                renameItem($oldPath, $newName);
                echo json_encode(array('success' => true, 'message' => 'Renamed'));
                break;

            case 'create':
                $path = isset($_POST['path']) ? $_POST['path'] : '';
                $name = isset($_POST['name']) ? $_POST['name'] : '';
                $type = isset($_POST['type']) ? $_POST['type'] : 'directory';
                createItem($path, $name, $type);
                echo json_encode(array('success' => true, 'message' => 'Created'));
                break;

            case 'read':
                $path = isset($_POST['path']) ? $_POST['path'] : '';
                $content = readFileContent($path);
                echo json_encode(array('success' => true, 'content' => $content));
                break;

            case 'write':
                $path = isset($_POST['path']) ? $_POST['path'] : '';
                $content = isset($_POST['content']) ? $_POST['content'] : '';
                writeFile($path, $content);
                echo json_encode(array('success' => true, 'message' => 'Saved'));
                break;

            case 'download':
                $path = isset($_GET['path']) ? $_GET['path'] : '';
                downloadFile($path);
                break;

            case 'compress':
                $path = isset($_POST['path']) ? $_POST['path'] : '';
                $format = isset($_POST['format']) ? $_POST['format'] : 'zip';
                $archiveName = compressItem($path, $format);
                echo json_encode(array('success' => true, 'message' => 'Archive created: ' . $archiveName));
                break;

            case 'extract':
                $path = isset($_POST['path']) ? $_POST['path'] : '';
                $extractedTo = extractItem($path);
                echo json_encode(array('success' => true, 'message' => 'Extracted to: ' . $extractedTo));
                break;

            case 'move':
                $destination = isset($_POST['destination']) ? $_POST['destination'] : '';
                $paths = array();
                if (isset($_POST['paths'])) {
                    $paths = is_array($_POST['paths']) ? $_POST['paths'] : array($_POST['paths']);
                } else {
                    $singlePath = isset($_POST['path']) ? $_POST['path'] : '';
                    if ($singlePath !== '') {
                        $paths = array($singlePath);
                    }
                }
                $result = moveItems($paths, $destination);
                $message = 'Moved ' . $result['moved'] . ' item' . ($result['moved'] === 1 ? '' : 's');
                if (!empty($result['skipped'])) {
                    $message .= ' (' . $result['skipped'] . ' skipped)';
                }
                echo json_encode(array('success' => true, 'message' => $message));
                break;

            case 'change_password':
                $currentPassword = isset($_POST['currentPassword']) ? $_POST['currentPassword'] : '';
                $newPassword = isset($_POST['newPassword']) ? $_POST['newPassword'] : '';
                updatePassword($_SESSION['username'], $currentPassword, $newPassword);
                echo json_encode(array('success' => true, 'message' => 'Password changed'));
                break;

            default:
                throw new Exception('Invalid action');
        }
    } catch (Exception $e) {
        echo json_encode(array('success' => false, 'error' => $e->getMessage()));
    }

    exit;
}
