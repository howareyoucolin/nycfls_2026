<?php
declare(strict_types=1);

function api_respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function api_ok(array $data = [], string $message = 'OK', int $statusCode = 200): void
{
    api_respond($statusCode, [
        'success' => true,
        'message' => $message,
        'data' => $data,
    ]);
}

function api_error(string $code, string $message, int $statusCode = 400, array $data = []): void
{
    api_respond($statusCode, [
        'success' => false,
        'error' => [
            'code' => $code,
            'message' => $message,
        ],
        'data' => $data,
    ]);
}
