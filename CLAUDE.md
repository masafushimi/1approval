# CLAUDE.md

## 社内システムの前提（取り違え注意）

- **SFA（営業管理）は自社開発の「エイチ SFA」**: https://eichiii-sfa.web.app/leads
  - Firebase（プロジェクトID: `eichiii-sfa`）。データは Firestore の `leads` / `deals` / `activities` / `companies` / `contacts` / `inquiries` など
  - ログイン必須。認証なしの読み取りは拒否される
  - 新規問い合わせ・セミナー申込みは Slack `#sfa-問い合わせ通知` に通知される
- **kintone は SFA ではない。** kintone は 1Approval のプラグイン連携先・デモ環境。商談やリードを探すときに kintone を見に行かないこと
