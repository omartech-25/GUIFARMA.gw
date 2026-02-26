
<?php
require_once 'config.php';

// Permitir requisições do frontend React (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        sendResponse(['error' => 'Email e senha são obrigatórios'], 400);
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND status = 'Ativo'");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            // Sucesso! Gerar Token de sessão (Simples para exemplo)
            $token = bin2hex(random_bytes(32));
            
            // Atualizar último login
            $update = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $update->execute([$user['id']]);

            sendResponse([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'email' => $user['email']
                ],
                'token' => $token
            ]);
        } else {
            sendResponse(['error' => 'Credenciais inválidas'], 401);
        }
    } catch (Exception $e) {
        sendResponse(['error' => 'Erro interno do servidor'], 500);
    }
}
?>
