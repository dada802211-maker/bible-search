<?php
// ローカルMySQLの接続設定。環境変数があればそちらを優先します。
return [
    'host' => getenv('DB_HOST') ?: '127.0.0.1',
    'port' => getenv('DB_PORT') ?: '3306',
    'database' => getenv('DB_NAME') ?: 'seisyo2022',
    'username' => getenv('DB_USER') ?: 'root',
    'password' => getenv('DB_PASSWORD') === false ? '' : getenv('DB_PASSWORD'),
];
