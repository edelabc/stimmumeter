<?php
// api/test.php - Einfacher Test-Endpunkt
require_once 'db.php';

echo json_encode([
    'status' => 'ok',
    'message' => 'API is working',
    'database' => 'connected',
    'timestamp' => date('c')
]);
?>
