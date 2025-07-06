## サービス名
- CoraI

## 既存の課題

- チャットが直列なため、複数の会話を並列で行えない
    - 例：ChatGPTで4つの論点について会話をしようとするとA→B→C→D→B→Aのように会話がサンドイッチ上になる
- 既存のソリューションだと分岐したチャットの関係性が視覚化されない or UIが既存のChatGPTなどと比較して変わりすぎているため参入障壁が高い

## サービスの目的

- 複数の論点についての議論を並行に進めることを可能にする
- 既存のサービスのUI UXを踏襲しつつ、ユニークで視覚的にわかりやすいグラフ構造を入れる

## ターゲット

- コンサル、エンジニア、マーケター、研究者などの知的生産性が求めれる業種
- まずはモバイルではなくPC向け

## サービス概要

- 既存のChatGPTなどのAIチャットツールのUIにトークのブランチを切る機能を追加する
- これにより、物事をMECEに考える時などに複数の観点を同時進行でAIと壁打ちすることができる
- 既存のUI/UX踏襲し、かつ革新的なグラフ表示をすることで参入障壁の低さとユニークなサービスとなりPMFが狙える

## 機能

- 一般的なUIでのAIチャット
- 好きな時点からのコンテキストを保持したままのブランチ作成
- 元のチャットを起点としたグラフビュー
- メッセージの下にあるブランチ作成ボタンを押したらコンテキストを保持したままモーダルか何かで新しいブランチを作れる
- 作成元のチャットブランチと新しいチャットブランチはシームレスに視覚的にも良い体験で移動できる
- （チームでの同時作業機能）
- （並列で行った議論のまとめ・結論出し）
- （ブランチごとのLLM切り替え）
- （プロジェクト機能）

## データベース設計例

- User
- Chat
- Message
- Branch
```
erDiagram
    User ||--o{ Chat : "creates"
    Chat ||--o{ Branch : "contains"
    Branch ||--o{ Message : "has"
    Branch ||--o{ Branch : "forks to"

    User {
        int id PK
        string email
        string password_hash
        string username
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
    }

    Chat {
        int id PK
        int user_id FK
        string title
        timestamp created_at
        timestamp updated_at
        boolean is_archived
    }

    Branch {
        int id PK
        int chat_id FK
        string name
        int parent_branch_id FK
        int fork_message_id
        timestamp created_at
        timestamp updated_at
    }

    Message {
        int id PK
        int branch_id FK
        text content
        string content_type
        string media_url
        jsonb media_metadata
        string role
        timestamp created_at
        int token_count
        string model_used
        boolean is_deleted
    }
```

## 開発手順
1. ユーザ認証なしでDBにチャットを保存できるようなAIチャットを開発
2. ユーザ認証を追加してユーザごとにチャット履歴を管理できるようにする
3. ブランチ機能を追加してチャットの木構造を表現できるようにする
4. UI/UXに優れたブランチ作成機能にする


## 技術スタック
### フロントエンド
Next.js 14 + TypeScript
Tailwind CSS + shadcn/ui
React Flow（グラフビュー用）

### バックエンド
Next.js API Routes
PostgreSQL + Prisma
OpenAI API

## 詳細
- 将来的にはブランチ作成時に目的をユーザに入力させることで最適なコンテキスト保持戦略を実現する