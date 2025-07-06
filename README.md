セットアップ手順

1. 環境変数を設定
   cp .env.example .env

# .env ファイルで OPENAI_API_KEY を設定

2. Docker でデータベースを起動
   npm run db:up
3. データベースマイグレーションを実行
   npm run db:migrate
4. 開発サーバーを起動
   npm run dev

便利なコマンド

- npm run db:up - PostgreSQLコンテナを起動
- npm run db:down - PostgreSQLコンテナを停止
- npm run db:reset - データベースを完全リセット
- npm run db:migrate - Prismaマイグレーションを実行
- npm run db:studio - Prisma Studioを起動（データベースGUI）
