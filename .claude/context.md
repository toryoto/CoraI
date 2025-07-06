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

### 実装済み機能
- ✅ 一般的なUIでのAIチャット
- ✅ Clerk認証システム
- ✅ OpenAI API統合（ストリーミング対応）
- ✅ チャット履歴の管理
- ✅ ダークモード対応
- ✅ レスポンシブデザイン

### 開発中機能（分岐システム）
- 🔄 好きな時点からのコンテキストを保持したままのブランチ作成
- 🔄 元のチャットを起点としたグラフビュー（React Flow）
- 🔄 分岐作成モーダル
  - 単一分岐: 1つの新しい質問
  - 複数分岐: 複数の質問を同時に作成
  - 比較分岐: 同じ質問を異なる方法で
  - 探索分岐: 関連する質問を自動生成
- 🔄 分岐間のシームレスな移動
- 🔄 並列処理による複数分岐の同時実行
- 🔄 デュアルビューUI（チャットビュー ⇄ フローフビュー）

### 将来的な機能
- 📋 チームでの同時作業機能
- 📋 並列で行った議論のまとめ・結論出し
- 📋 ブランチごとのLLM切り替え
- 📋 プロジェクト機能

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

1. ✅ ユーザ認証なしでDBにチャットを保存できるようなAIチャットを開発
2. ✅ ユーザ認証を追加してユーザごとにチャット履歴を管理できるようにする（Clerk認証システム実装済み）
3. 🔄 ブランチ機能を追加してチャットの木構造を表現できるようにする（現在開発中）
4. 📋 UI/UXに優れたブランチ作成機能にする

## 技術スタック

### フロントエンド

Next.js 14 + TypeScript
Tailwind CSS + shadcn/ui
React Flow（グラフビュー用）

### バックエンド

Next.js API Routes
PostgreSQL + Prisma
OpenAI API

## 分岐機能の詳細設計

### 分岐作成フロー
1. AIメッセージにホバー → 分岐ボタン（🔀）表示
2. 分岐ボタンクリック → 分岐作成モーダル表示
3. 分岐タイプ選択 & 設定入力
4. プレビュー確認 → 作成実行
5. React Flowに分岐反映 → 最初の分岐にフォーカス

### コンテキスト管理
- **完全独立**: 各分岐は独立したメッセージ履歴を持つ
- **汚染防止**: メイン会話への影響を完全に防ぐ
- **並列実行**: 複数分岐を同時に処理可能

### 視覚化
- **デュアルビュー**: 通常のチャットUI ⇄ React Flowビュー
- **リアルタイム**: 分岐作成・進行をリアルタイムで表示
- **直感的操作**: ノードクリックで分岐切り替え

### 技術実装
- **データベース**: PostgreSQL + Prisma
- **状態管理**: React hooks（useBranchManager）
- **API**: RESTful API（分岐CRUD操作）
- **UI**: shadcn/ui + React Flow

### 開発方針
- **段階的実装**: 最小限の機能から開始して拡張
- **ユーザビリティ**: 直感的で使いやすいUI/UX
- **パフォーマンス**: 100ノードまで60FPSを維持
- **スケーラビリティ**: 将来的な機能拡張に対応

### 参考資料
- 完全要件定義書: `docs/branch-feature-requirements.md`
- 実装ガイド: `CLAUDE.md`の「Branch/Fork Functionality」セクション
