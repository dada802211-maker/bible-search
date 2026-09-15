<?php
declare(strict_types=1);

// SQLダンプの列名を、画面で扱いやすい名前に変換します。
class BibleRepository
{
    public function __construct(private PDO $db) {}

    public function books(): array
    {
        return $this->db->query('SELECT no, name, syonum AS chapterCount FROM sei0 ORDER BY no')->fetchAll();
    }

    public function book(int $no): ?array
    {
        $query = $this->db->prepare('SELECT no, name, syonum AS chapterCount FROM sei0 WHERE no = ? LIMIT 1');
        $query->execute([$no]);
        return $query->fetch() ?: null;
    }

    public function chapters(int $no): array
    {
        $query = $this->db->prepare('SELECT DISTINCT syo AS chapter, setnum AS verseCount FROM sei1 WHERE taino = ? ORDER BY syo');
        $query->execute([$no]);
        return $query->fetchAll();
    }

    public function verses(int $no, int $chapter, ?int $verse, ?int $verseEnd = null): array
    {
        // 入力値をSQLに直接連結せず、プレースホルダーで渡します。
        $sql = 'SELECT set0 AS verse, nai AS text FROM sei7 WHERE tai_no = ? AND syo = ?';
        $params = [$no, $chapter];
        if ($verse !== null) {
            // 終了節を省略した場合は開始節と同じにし、1節だけ取得します。
            $sql .= ' AND set0 BETWEEN ? AND ?';
            $params[] = $verse;
            $params[] = $verseEnd ?? $verse;
        }
        $query = $this->db->prepare($sql . ' ORDER BY set0');
        $query->execute($params);
        return $query->fetchAll();
    }
}

