# 塾内向け代講マッチングシステム

## プロジェクト概要
塾内における講師の代講調整を効率化するためのWebアプリケーションです。紙やチャットツールでの煩雑なやり取りを解消し、カレンダー形式で代講の依頼・引き受け状況を視覚的に把握できるようにします。

## 技術スタック
- **フロントエンド**: Next.js 15, React 19, TypeScript, FullCalendar.io
- **UI/UX**: Mantine UI, SCSS Modules
- **認証**: NextAuth.js
- **データベース**: PostgreSQL, Prisma ORM
- **その他**: Git/GitHub

## 主な機能
- カレンダー形式でのシフト・代講依頼の表示
- 代講依頼の登録
- 代講依頼の引き受け
- 講師および代講履歴の管理

## 環境構築手順

### 前提条件
- Node.js 18+ および npm
- Git
- PostgreSQL 14+

### セットアップ手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **環境変数の設定**
   ```bash
   cp env.example .env.local
   # .env.localファイルを編集してデータベース接続情報を設定
   ```

3. **データベースのセットアップ**
   ```bash
   # PostgreSQLに substitute_matching_db という名前のデータベースを作成
   createdb substitute_matching_db
   
   # Prismaマイグレーションの実行
   npm run db:push
   ```

4. **アプリケーションの起動**
   ```bash
   npm run dev
   ```

5. **アクセス**
   - アプリケーション: http://localhost:3000
   - ログインページ: http://localhost:3000/auth/signin

## プロジェクト構造
```
├── app/                    # Next.js アプリケーション
│   ├── api/               # API Routes
│   ├── auth/              # 認証ページ
│   └── globals.css        # グローバルスタイル
├── components/            # React コンポーネント
│   ├── ui/               # UI コンポーネント
│   └── calendar/         # カレンダー関連コンポーネント
├── lib/                  # ユーティリティ
│   ├── auth/            # 認証設定
│   └── db/              # データベース設定
├── prisma/              # データベーススキーマ
├── public/              # 静的ファイル
├── styles/              # SCSS Modules
├── docs/               # ドキュメント
└── README.md           # このファイル
```

## 今後の改善点
- 代講依頼が引き受けられた際のリアルタイム通知機能（WebSocket）
- 講師ごとの代講実績レポート機能
- モバイルフレンドリーなUI/UXの改善
