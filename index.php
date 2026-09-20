<?php
// Viteのビルド結果を、このフォルダーのURLで表示します。
declare(strict_types=1);

$indexPath = __DIR__ . '/frontend/dist/index.html';
if (!is_file($indexPath)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    exit('frontend フォルダーで npm run build を実行してください。');
}

echo str_replace('./assets/', './frontend/dist/assets/', file_get_contents($indexPath));
