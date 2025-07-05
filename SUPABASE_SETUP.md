# Supabase セットアップガイド

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてサインアップ
2. 新しいプロジェクトを作成
   - プロジェクト名: `corai`
   - データベースパスワード: 安全なパスワードを設定（後で使用）
   - リージョン: 最寄りのリージョンを選択

## 2. 環境変数の設定

1. Supabaseダッシュボードから以下の情報を取得：
   - Settings > API から:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Settings > Database から:
     - `Connection string` → `DATABASE_URL` と `DIRECT_URL`

2. `.env.local` ファイルを作成：
```bash
cp .env.example .env.local
```

3. `.env.local` を編集して実際の値を設定：
```env
# OpenAI API Key
OPENAI_API_KEY=your_actual_openai_api_key

# Supabase Configuration
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

## 3. データベースのセットアップ

```bash
# Prismaクライアントの生成
npm run db:generate

# データベーススキーマをSupabaseにプッシュ
npm run db:push
```

## 4. 開発サーバーの起動

```bash
npm run dev
```

## トラブルシューティング

### SSL接続エラーが出る場合
DATABASE_URLに `?sslmode=require` を追加：
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&sslmode=require"
```

### マイグレーションが失敗する場合
1. Supabaseダッシュボードで SQL Editor を開く
2. 以下のコマンドを実行してデータベースをリセット：
```sql
-- 既存のテーブルを削除（注意：データが消えます）
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
3. 再度 `npm run db:push` を実行

## 便利なコマンド

- `npm run db:studio` - Prisma Studio（データベースGUI）を起動
- `npm run db:push` - スキーマ変更をデータベースに反映
- `npm run db:generate` - Prismaクライアントを再生成