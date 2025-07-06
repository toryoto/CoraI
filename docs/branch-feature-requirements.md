# チャット分岐機能 要件定義書

## 1. 概要

### 1.1 目的
- **コンテキスト汚染防止**: メインの会話の流れを保ちながら、特定の話題を深堀りする
- **並列議論**: 複数の観点から同時に議論を進める
- **探索的会話**: 会話の可能性を最大限に活用する

### 1.2 対象ユーザー
- 詳細な調査や学習を行いたいユーザー
- 複数の選択肢を比較検討したいユーザー
- 会話の流れを整理したいユーザー

## 2. 機能要件

### 2.1 分岐作成機能

#### 2.1.1 分岐トリガー
- **対象**: 任意のAIメッセージ
- **操作**: ホバー時に分岐ボタン（🔀）を表示
- **クリック**: 分岐メニューモーダルを開く

#### 2.1.2 分岐メニューモーダル
```typescript
interface BranchCreationModal {
  branchTypes: {
    single: "単一分岐 - 1つの新しい質問"
    multiple: "複数分岐 - 複数の質問を同時に作成"
    compare: "比較分岐 - 同じ質問を異なる方法で"
    explore: "探索分岐 - 関連する質問を自動生成"
  }
  
  settings: {
    branchCount: number // 作成する分岐数 (1-5)
    branchNames: string[] // 各分岐の名前
    branchColors: string[] // 各分岐の色
    questions: string[] // 各分岐の質問内容
  }
  
  metadata: {
    purpose: string // 分岐の目的
    tags: string[] // 分類タグ
    priority: "high" | "medium" | "low"
  }
}
```

#### 2.1.3 分岐作成フロー
1. 分岐ボタンクリック
2. モーダル表示
3. 分岐タイプ選択
4. 設定入力（質問内容、数、色など）
5. プレビュー表示
6. 作成実行
7. React Flowに反映
8. 最初の分岐にフォーカス

### 2.2 分岐管理機能

#### 2.2.1 分岐の状態管理
```typescript
interface Branch {
  id: string
  parentBranchId: string | null
  chatId: string
  name: string
  color: string
  isActive: boolean
  createdAt: Date
  metadata: {
    purpose: string
    tags: string[]
    priority: "high" | "medium" | "low"
  }
}

interface Message {
  id: string
  branchId: string
  parentMessageId: string | null
  content: string
  role: "user" | "assistant"
  timestamp: Date
  metadata: Json
}
```

#### 2.2.2 分岐切り替え
- **アクティブ分岐**: 現在の会話対象
- **切り替え方法**: 
  - React Flowのノードクリック
  - 分岐リストからの選択
  - パンくずリストからの選択

### 2.3 視覚化機能

#### 2.3.1 React Flow統合
- **ノードタイプ**: 
  - MessageNode: 個別メッセージ
  - BranchNode: 分岐点
  - SummaryNode: 分岐の概要
- **エッジタイプ**:
  - 通常の会話フロー
  - 分岐関係
  - 参照関係

#### 2.3.2 レイアウト
```typescript
type LayoutType = "horizontal" | "vertical" | "radial"

interface ViewConfig {
  layout: LayoutType
  showInactive: boolean // 非アクティブ分岐の表示
  colorCoding: boolean // 色分け表示
  compactMode: boolean // コンパクト表示
}
```

#### 2.3.3 デュアルビューUI
- **メインビュー**: 通常のチャット画面
- **フロービュー**: React Flowによる分岐視覚化
- **切り替え**: サイドバーのトグルボタン

## 3. 非機能要件

### 3.1 パフォーマンス
- **分岐作成時間**: 1秒以内
- **並列処理**: 最大5分岐まで同時実行
- **React Flow描画**: 100ノードまで60FPSを維持

### 3.2 データ整合性
- **分岐の独立性**: 各分岐のコンテキストは完全に独立
- **参照の整合性**: 親子関係の整合性を保持
- **状態の同期**: UI状態とデータベース状態の一致

### 3.3 ユーザビリティ
- **直感的操作**: 分岐作成は2クリック以内
- **視覚的明確性**: アクティブ分岐の明確な表示
- **レスポンシブ**: モバイル対応

## 4. 技術仕様

### 4.1 データベース設計
```sql
-- チャットテーブル
CREATE TABLE chats (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 分岐テーブル
CREATE TABLE branches (
  id UUID PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id),
  parent_branch_id UUID REFERENCES branches(id),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- メッセージテーブル
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  parent_message_id UUID REFERENCES messages(id),
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 API設計
```typescript
// 分岐作成API
POST /api/chats/:chatId/branches
{
  parentMessageId: string
  branches: Array<{
    name: string
    color: string
    question: string
  }>
}

// 分岐切り替えAPI
PUT /api/chats/:chatId/active-branch
{
  branchId: string
}

// 分岐取得API
GET /api/chats/:chatId/branches
Response: Branch[]

// 分岐削除API
DELETE /api/chats/:chatId/branches/:branchId
```

### 4.3 状態管理
```typescript
interface ChatState {
  activeBranchId: string
  branches: Branch[]
  messages: Record<string, Message[]> // branchId -> messages
  branchCreationModal: {
    isOpen: boolean
    parentMessageId: string | null
    config: BranchCreationConfig
  }
}
```

## 5. 実装フェーズ

### Phase 1: 基本機能 (2週間)
- [ ] 単一分岐の作成・切り替え
- [ ] 基本的なUI実装
- [ ] データベース設計・実装

### Phase 2: 視覚化 (2週間)
- [ ] React Flow統合
- [ ] デュアルビューUI
- [ ] 分岐の色分け・アイコン

### Phase 3: 高度な機能 (2週間)
- [ ] 複数分岐の同時作成
- [ ] 分岐メニューモーダル
- [ ] 並列処理機能

### Phase 4: 最適化 (1週間)
- [ ] パフォーマンス最適化
- [ ] モバイル対応
- [ ] テスト実装

## 6. 成功指標

### 6.1 利用指標
- 分岐作成率: 会話あたり平均2分岐以上
- 分岐活用率: 作成した分岐の80%以上がメッセージ交換
- ユーザー継続率: 分岐機能利用後の継続利用率向上

### 6.2 技術指標
- 分岐作成時間: 平均1秒以内
- React Flow描画時間: 100ms以内
- エラー率: 0.1%以下

## 7. リスク分析

### 7.1 技術リスク
- **複雑性**: 分岐管理の複雑さによるバグ
- **パフォーマンス**: 大量の分岐による性能劣化
- **状態管理**: 複数分岐の状態同期の困難さ

### 7.2 UXリスク
- **認知負荷**: 複雑なUI による混乱
- **情報過多**: 多数の分岐による情報の氾濫
- **操作迷子**: 分岐間の移動での迷子

### 7.3 対策
- **段階的実装**: 最小限の機能から開始
- **ユーザーテスト**: 早期かつ継続的なフィードバック収集
- **パフォーマンス監視**: リアルタイムでの性能監視

## 8. 結論

この分岐機能は、従来のチャットアプリケーションの限界を打ち破る革新的な機能です。コンテキスト汚染を防ぎながら、並列的な議論を可能にし、ユーザーの思考プロセスを支援します。

段階的な実装により、リスクを最小限に抑えながら、高品質な機能を提供できます。