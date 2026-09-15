<?php
declare(strict_types=1);
require __DIR__ . '/../src/Database.php';
require __DIR__ . '/../src/BibleRepository.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function positiveInteger(string $key, bool $optional = false): ?int
{
    $value = $_GET[$key] ?? null;
    if ($optional && ($value === null || $value === '')) return null;
    if (!is_string($value) || !preg_match('/^[1-9][0-9]{0,8}$/D', $value)) {
        respond(400, ['error' => "$key は1以上の整数で指定してください。"]);
    }
    return (int) $value;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        header('Allow: GET');
        respond(405, ['error' => 'GETメソッドを使用してください。']);
    }
    $action = $_GET['action'] ?? 'books';
    if (!in_array($action, ['books', 'book', 'verses'], true)) {
        respond(400, ['error' => '指定された操作はありません。']);
    }
    $repository = new BibleRepository(connectDatabase());
    if ($action === 'books') respond(200, ['books' => $repository->books()]);

    $no = positiveInteger('no');
    $book = $repository->book($no);
    if (!$book) respond(404, ['error' => 'このnoの聖書名は見つかりません。']);
    $chapters = $repository->chapters($no);
    if ($action === 'book') respond(200, ['book' => $book, 'chapters' => $chapters]);

    $chapter = positiveInteger('chapter');
    $verse = positiveInteger('verse', true);
    $verseEnd = positiveInteger('verseEnd', true);
    if ($verseEnd !== null && ($verse === null || $verseEnd < $verse)) {
        respond(400, ['error' => '終了の節は、開始の節を指定したうえで開始以上の番号にしてください。']);
    }
    if (!in_array($chapter, array_map('intval', array_column($chapters, 'chapter')), true)) {
        respond(404, ['error' => '指定された章は見つかりません。']);
    }
    foreach ($chapters as $item) {
        if ((int) $item['chapter'] === $chapter && max($verse ?? 0, $verseEnd ?? 0) > (int) $item['verseCount']) {
            respond(404, ['error' => '指定された節はこの章にありません。']);
        }
    }
    $verses = $repository->verses($no, $chapter, $verse, $verseEnd);
    if (!$verses) respond(404, ['error' => '指定された節の本文は見つかりません。']);
    respond(200, ['book' => $book, 'chapter' => $chapter, 'verses' => $verses]);
} catch (Throwable $error) {
    // 接続情報やSQLの詳細はブラウザーに公開せず、サーバーログへ記録します。
    error_log((string) $error);
    respond(500, ['error' => 'データを取得できません。MySQLの起動と接続設定を確認してください。']);
}
