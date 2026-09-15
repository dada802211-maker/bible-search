# 作業フォルダー

このプロジェクトの保存先は `C:\laragon\www\bible-search` です。起動時はこのフォルダーに移動してください。

# 聖書を読む — React + PHP + MySQL

聖書番号 `no` を入力して聖書名 `name` を選び、章全体、指定した1節、または指定範囲の本文を表示するアプリです。日本語コメントを入れ、画面・通信・API・SQL・接続設定を分離しています。

## 必要な環境

- Node.js 22.12以上（検証時は24.19）、npm または pnpm
- PHP 8.1以上、PDO / pdo_mysql 拡張
- MySQL（提供されたSQLはMySQL 9.6.0のエクスポート）

## フォルダー構成

```text
bible-search/
├─ backend/
│  ├─ config/database.php       # MySQL接続設定
│  ├─ public/api.php            # API受付、入力チェック、JSON応答
│  └─ src/
│     ├─ Database.php          # PDO接続
│     └─ BibleRepository.php   # 聖書データ取得SQL
├─ frontend/
│  ├─ src/
│  │  ├─ main.jsx              # Reactの起動
│  │  ├─ App.jsx               # no入力、章・節選択、画面の状態管理
│  │  ├─ api.js                # PHPへの通信
│  │  ├─ components/VerseList.jsx # 節の表示
│  │  └─ styles.css            # PC・スマートフォン用スタイル
│  ├─ index.html
│  ├─ package.json
│  ├─ package-lock.json        # npmの依存バージョン
│  └─ vite.config.ts           # PHPへのプロキシ設定
├─ seisyo2022.sql              # 提供されたSQL
└─ README.md
```

## 1. データベースの準備

ローカル接続の既定値は次のとおりです。

| 項目 | 値 |
| --- | --- |
| ホスト | 127.0.0.1 |
| ポート | 3306 |
| データベース | seisyo2022 |
| ユーザー | root |
| パスワード | 空文字 |

既に `seisyo2022` にテーブルとデータがある場合、インポートは不要です。このPCでは既存DBへの読み取りで動作確認しました。既存DBの内容は変更していません。

新しい環境では、MySQLを起動し、phpMyAdminで文字コードutf8mb4の `seisyo2022` データベースを作成します。そのDBを選択し、「インポート」で `seisyo2022.sql` を指定してください。SQLにはCREATE TABLEが含まれるため、空のDBに一度だけインポートします。

MySQLクライアントで行う場合は以下を順に実行します。パスは実際の保存先に置き換えてください。

```sql
CREATE DATABASE IF NOT EXISTS seisyo2022 CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE seisyo2022;
SOURCE C:/path/to/bible-search/seisyo2022.sql;
```

`backend/config/database.php` で接続先を変更できます。環境変数 `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD` でも上書きできます（.envファイルの自動読み込みはありません）。公開環境で使う際は読み取り専用のDBユーザーとパスワードを設定してください。

### 使用テーブル

| テーブル | 列 | 用途 |
| --- | --- | --- |
| sei0 | no, name, syonum | 聖書番号、聖書名、章数 |
| sei1 | taino, syo, setnum | 聖書番号、章番号、節数 |
| sei7 | tai_no, syo, set0, nai | 聖書番号、章番号、節番号、本文 |
| kou | — | このアプリでは使用しません |

`sei0.no = sei1.taino = sei7.tai_no` で対応します。元データのsei1に同じ章情報が複数あるため、SELECT DISTINCTで同一の選択肢をまとめています。DB自体は変更しません。

## 2. PHPを起動

ターミナルで `bible-search` フォルダーへ移動して実行します。

```powershell
php -S 127.0.0.1:8000 -t backend/public
```

PHPがPATHにないXAMPP環境では、代わりに次を実行します。

```powershell
C:\xampp\php\php.exe -S 127.0.0.1:8000 -t backend/public
```

APIの確認先：http://127.0.0.1:8000/api.php?action=books

## 3. Reactを起動

別のターミナルで `bible-search` フォルダーから実行します。

```powershell
cd frontend
npm install
npm run dev
```

既存のnpm構成を使用します。初期テンプレートのTSXファイルは残していますが、画面の入口は `src/main.jsx`、実装は `src/App.jsx` です。

ブラウザーで **http://127.0.0.1:5173/** を開きます。PHPとReactのターミナルは両方起動したままにします。停止は各ターミナルでCtrl+Cです。

Reactは `/api.php` に通信し、Viteが `http://127.0.0.1:8000` のPHPへ転送します。ポートを変える場合は `vite.config.ts` も合わせて修正してください。

## 4. 操作方法

1. 聖書番号を4桁入力すると、自動で聖書名を選択して章にフォーカスが移ります（例：1001）。「選択」ボタンも使用できます。
2. 聖書名に「創世記」と表示されます。
3. 「章」で数字キーまたは矢印キーを使って章を選び、Tabキーで「開始の節」に移動します。
4. 「開始の節」は「すべての節」または読みたい開始節を選びます。終了の節（任意）を指定すると、開始から終了までの節を両端を含めて表示します。終了を「指定しない」にすると開始の1節だけ表示します。章や開始節を変えると終了節はリセットされます。
5. 「本文を表示」を押します。1章1節なら「はじめに神は天と地とを創造された。」が表示されます。

「聖書番号の一覧」で番号と名前を確認できます。番号入力欄でも候補が表示されます。存在しない番号や本文にはエラーメッセージを表示します。

## API

すべてGETでアクセスします。成功・エラーともJSONです。

| クエリー | 内容 |
| --- | --- |
| `?action=books` | 聖書番号・名前一覧 |
| `?action=book&no=1001` | 聖書名と章の選択肢 |
| `?action=verses&no=1001&chapter=1` | 創世記1章の全節 |
| `?action=verses&no=1001&chapter=1&verse=1` | 創世記1章1節 |
| `?action=verses&no=1001&chapter=1&verse=3&verseEnd=5` | 創世記1章3〜5節（両端を含む） |

HTTP 400は入力不正、404はデータなし、405はGET以外、500はDB接続などのサーバーエラーです。SQLはプリペアドステートメントを使用し、本文はReactのテキストとして表示しています。

## ビルドと確認

```powershell
cd frontend
npm run build
npm run preview
```

`dist/` にビルド結果が生成されます。previewのURLは http://127.0.0.1:4173/ です。この場合もPHPの起動が必要です。Viteの開発・previewサーバーとPHP組み込みサーバーはローカル確認用です。公開する場合はビルド結果とPHP公開ディレクトリを同一オリジンで配信するWebサーバー設定が別途必要です。

### トラブルシューティング

- DB接続エラー：MySQL、DB名、ポート、ユーザー、pdo_mysqlを確認してください。
- XAMPPのmysql.exeがcaching_sha2_password.dllエラーになる：提供ダンプのMySQLと互換性のあるクライアントまたはphpMyAdminを使用してください。このPCのPHP PDOでは接続できました。
- ポート使用中：既存プロセスを確認するか、起動ポートとVite設定を変更します。
- APIが取得できない：PHPとViteを両方起動し、PHP側ターミナルのログを確認します。

## 参考資料

- [Vite公式ガイド](https://vite.dev/guide/)
- [PHP PDO::prepare](https://www.php.net/manual/ja/pdo.prepare.php)

## 動作確認結果

- PHPファイルの構文チェック：成功
- React/Vite本番ビルド：成功
- 実DB：聖書名66件、創世記の章選択肢50件、1章の本文31節
- 創世記1章1節の本文一致：成功
- 不正入力、配列入力、存在しないno・章・節、未定義操作：期待どおり400/404
- POSTリクエスト：405
- ブラウザー：no=1001の選択、創世記の名前表示、1章31節の表示を確認

### 任意の範囲指定

終了節のAPIパラメーターは `verseEnd` です。省略・空文字は1節のみ、開始・終了とも省略は章全体です。終了のみの指定や逆順は400、章の節数を超える指定は404です。

追加検証：3〜5節が3件、終了省略が1件、開始と終了が同じ場合が1件、全節が31件であることと、不正範囲の400/404を実DBで確認済み。PHP構文チェック・Reactビルドも成功。


キーボード操作の確認：1002入力後に出エジプト記を自動選択し章へフォーカス、数字2で2章を選択後Tabで開始の節へ移動することをブラウザーで確認済み。存在しない番号では章に移動せずエラーを表示します。



