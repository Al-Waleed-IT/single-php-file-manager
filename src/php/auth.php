// Authentication Functions

function initializeUsers() {
    if (!file_exists(USERS_FILE)) {
        $defaultUser = array(
            'username' => 'admin',
            'password' => password_hash('admin', PASSWORD_BCRYPT, array('cost' => BCRYPT_COST))
        );
        file_put_contents(USERS_FILE, json_encode(array($defaultUser)));
    }
}

function getUsers() {
    if (!file_exists(USERS_FILE)) {
        initializeUsers();
    }
    return json_decode(file_get_contents(USERS_FILE), true);
}

function verifyLogin($username, $password) {
    $users = getUsers();
    foreach ($users as $user) {
        if ($user['username'] === $username) {
            return password_verify($password, $user['password']);
        }
    }
    return false;
}

function isAuthenticated() {
    return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
}

function updatePassword($username, $currentPassword, $newPassword) {
    if (strlen($newPassword) < 6) {
        throw new Exception('Password must be at least 6 characters');
    }

    $users = getUsers();
    $found = false;

    foreach ($users as $key => $user) {
        if ($user['username'] === $username) {
            if (!password_verify($currentPassword, $user['password'])) {
                throw new Exception('Current password is incorrect');
            }

            $users[$key]['password'] = password_hash($newPassword, PASSWORD_BCRYPT, array('cost' => BCRYPT_COST));
            $found = true;
            break;
        }
    }

    if (!$found) {
        throw new Exception('User not found');
    }

    if (file_put_contents(USERS_FILE, json_encode($users)) === false) {
        throw new Exception('Failed to save password');
    }

    return true;
}
