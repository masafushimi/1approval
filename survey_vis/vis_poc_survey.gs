// ===== ヴィス社 1approval POC アンケート 設問定義（事前／事後 共通の物差しで比較） =====
var TIME = ['5分未満', '5〜10分', '10〜20分', '20〜30分', '30〜60分', '60分以上'];
var WAIT = ['当日中', '翌営業日', '2〜3営業日', '4営業日以上'];
var TIMES = ['0回', '1回', '2〜3回', '4回以上'];
var PAIN = [
  '稟議申請前の料金・ホテル調べ',
  'マネーフォワード クラウド経費への稟議入力',
  '承認待ち',
  '承認後に各サイト（スマートEX・楽天トラベル等）で予約し直すこと',
  '稟議と予約サイトへの同じ情報の二重入力',
  '運賃・宿泊費の立替',
  '領収書・利用明細の保管／添付',
  '出張後の経費精算入力',
  '予定変更・キャンセル時の対応',
  '特になし'
];
var S5 = { low: '非常に不満', high: '非常に満足' };

var SPEC = {
  pre: {
    title: '【事前】1approval POC アンケート（現状把握）— 株式会社ヴィス様',
    description:
      '本アンケートは、POC開始前の「現在の出張手配・精算の流れ」の手間を把握するためのものです。\n' +
      '現在の流れ：マネーフォワード クラウド経費で稟議申請 → 承認 → ご自身で各サイト（スマートEX・楽天トラベル等）から購入・立替 → 経費精算\n' +
      'POC終了後にも同じ設問でお伺いし、導入前後の変化を比較します。直近3か月の平均的な出張を思い浮かべてご回答ください（所要時間：約5分）。',
    pages: [
      { id: 'P1', title: '回答者情報', items: [
        { t: 'text', q: 'お名前', req: true },
        { t: 'text', q: '部署・役職', req: true },
        { t: 'radio', q: '主な勤務拠点', opts: ['東京（汐留）', '大阪', '名古屋'], other: true },
        { t: 'gate', q: 'POC期間中、出張者として1approvalを利用する予定ですか？', req: true, go: [['はい', 'A'], ['いいえ', 'BG']] }
      ]},
      { id: 'A', title: '出張者の方へ：現在の出張手配・精算の手間', items: [
        { t: 'radio', q: 'A1. 直近3か月の出張回数（往復）', req: true, opts: ['0回', '1〜2回', '3〜5回', '6〜10回', '11回以上'] },
        { t: 'check', q: 'A2. 主に利用している手配方法（複数選択可）', opts: ['スマートEX', 'えきねっと', '駅窓口・券売機', '楽天トラベル', 'じゃらん', '一休.com', 'ホテル公式サイト', '航空会社サイト'], other: true },
        { t: 'radio', q: 'A3. 出張1回あたり、稟議申請の作成にかかる時間（料金・ホテルの下調べを含む）', req: true, opts: TIME },
        { t: 'radio', q: 'A4. 出張1回あたり、承認後に各サイトで予約・購入を完了するまでの時間', req: true, opts: TIME },
        { t: 'radio', q: 'A5. 出張1回あたり、出張後の経費精算（入力・領収書添付）にかかる時間', req: true, opts: TIME },
        { t: 'radio', q: 'A6. 稟議申請から承認されるまでの平均的な待ち時間', req: true, opts: WAIT },
        { t: 'radio', q: 'A7. 直近3か月で、承認待ちの間に料金上昇・満席・希望ホテルの売り切れが起きた回数', opts: TIMES },
        { t: 'radio', q: 'A8. 直近3か月で、稟議の金額と実際の購入額がずれて修正・再申請・差し戻しになった回数', opts: TIMES },
        { t: 'radio', q: 'A9. 直近3か月で、出張の予定変更・キャンセルが発生した回数', opts: TIMES },
        { t: 'scale', q: 'A10. 予定変更・キャンセル時の手続きの負担感', low: '負担はない', high: '非常に負担' },
        { t: 'scale', q: 'A11. 運賃・宿泊費の立替の負担感', low: '負担はない', high: '非常に負担' },
        { t: 'check', q: 'A12. 現在の流れで手間・ストレスを感じる工程（複数選択可）', req: true, opts: PAIN, other: true },
        { t: 'scale', q: 'A13. 現在の出張手配〜精算の流れの総合満足度', req: true, low: S5.low, high: S5.high },
        { t: 'para', q: 'A14. 現在の流れで困っていること・改善してほしいこと（自由記述）' }
      ]},
      { id: 'BG', title: '承認者の方へ', items: [
        { t: 'gate', q: '出張の稟議を承認する立場ですか？', req: true, go: [['はい', 'B'], ['いいえ', 'CG']] }
      ]},
      { id: 'B', title: '承認者の方へ：現在の承認業務', items: [
        { t: 'radio', q: 'B1. 1か月あたりの出張稟議の承認件数', req: true, opts: ['0〜5件', '6〜10件', '11〜20件', '21件以上'] },
        { t: 'radio', q: 'B2. 1件あたりの確認・承認にかかる時間', req: true, opts: ['1分未満', '1〜3分', '3〜5分', '5〜10分', '10分以上'] },
        { t: 'check', q: 'B3. 承認時に困ること（複数選択可）', opts: ['金額の妥当性が判断しにくい', '規程に合っているか確認が必要', '行程・目的が分かりにくい', '承認後に実際に何を買ったか見えない', '承認依頼に気付くのが遅れる', '特になし'], other: true },
        { t: 'scale', q: 'B4. 現在の承認業務の満足度', req: true, low: S5.low, high: S5.high }
      ]},
      { id: 'CG', title: '経理・管理部門の方へ', items: [
        { t: 'gate', q: '出張費の精算チェック・仕訳・支払などを担当していますか？', req: true, go: [['はい', 'C'], ['いいえ', 'D']] }
      ]},
      { id: 'C', title: '経理・管理部門の方へ：現在の精算・経理業務', items: [
        { t: 'radio', q: 'C1. 1か月あたりの出張精算の処理件数', req: true, opts: ['〜30件', '31〜60件', '61〜100件', '101件以上'] },
        { t: 'radio', q: 'C2. 出張精算1件あたりのチェック・仕訳・支払処理の時間', req: true, opts: ['3分未満', '3〜5分', '5〜10分', '10〜20分', '20分以上'] },
        { t: 'radio', q: 'C3. 1か月あたりの出張精算の差し戻し件数', opts: ['0件', '1〜3件', '4〜10件', '11件以上'] },
        { t: 'check', q: 'C4. 差し戻し・確認が必要になる主な理由（複数選択可）', opts: ['領収書・明細の不備', '稟議金額と精算金額の不一致', '事前申請の漏れ', '規程外の手配（クラス・金額等）', '適格請求書（インボイス）の確認', '精算の提出遅れ'], other: true },
        { t: 'radio', q: 'C5. 稟議（事前申請）と精算実績の突合を行っていますか', opts: ['全件行っている', '一部行っている', '行っていない'] },
        { t: 'radio', q: 'C6. インボイス確認（出張・購買含む）にかかる1か月あたりの時間', opts: ['1時間未満', '1〜3時間', '3〜5時間', '5〜10時間', '10時間以上'] },
        { t: 'radio', q: 'C7. 宿泊を法人一括請求（実費）で手配する場合、現在のエリア別一律手当との関係をどう考えますか', opts: ['手当制度は維持し、POCでは宿泊は対象外', '手当と併用で検証したい', '実費精算化も検討したい', '役員のみ実費で検証したい', '未定・要相談'] },
        { t: 'para', q: 'C8. 出張精算・購買（社内行事の備品購入等）で現在困っていること（自由記述）' }
      ]},
      { id: 'D', title: 'POCへの期待', items: [
        { t: 'check', q: 'D1. POCで特に確認したいこと（複数選択可）', opts: ['申請〜手配の手間が本当に減るか', '立替・精算がなくなるか', '承認と実際の手配が一致するか', '予定変更・キャンセルに対応できるか', '社内規定・ルールとの整合', '経理の処理負担の削減', 'Teams・SharePointとの連携'], other: true },
        { t: 'para', q: 'D2. その他、POCへのご要望（自由記述）' }
      ]}
    ]
  },

  post: {
    title: '【事後】1approval POC アンケート（効果検証）— 株式会社ヴィス様',
    description:
      'POCへのご協力ありがとうございました。POC期間中の1approvalでの出張手配・精算についてお伺いします。\n' +
      '事前アンケートと同じ物差しの設問を含めていますので、POC期間中の平均的な出張を思い浮かべてご回答ください（所要時間：約8分）。',
    pages: [
      { id: 'P1', title: '回答者情報', items: [
        { t: 'text', q: 'お名前', req: true },
        { t: 'text', q: '部署・役職', req: true },
        { t: 'gate', q: 'POC期間中、出張者として1approvalで出張を申請・手配しましたか？', req: true, go: [['はい', 'A'], ['いいえ', 'BG']] }
      ]},
      { id: 'A', title: '出張者の方へ：1approvalでの手配・精算', items: [
        { t: 'radio', q: 'A1. POC期間中に1approvalで手配した出張回数（往復）', req: true, opts: ['1回', '2〜3回', '4〜5回', '6回以上'] },
        { t: 'check', q: 'A2. 1approvalで手配したもの（複数選択可）', opts: ['新幹線', '航空券', '宿泊'], other: true },
        { t: 'radio', q: 'A3. 出張1回あたり、申請の作成にかかった時間（行程・ホテルの検索を含む）', req: true, opts: TIME },
        { t: 'radio', q: 'A4. 承認後、予約確定までに追加で必要だった作業時間', req: true, opts: ['追加作業なし（承認と同時に確定）'].concat(TIME) },
        { t: 'radio', q: 'A5. 出張1回あたり、出張後の経費精算にかかった時間', req: true, opts: ['精算不要（0分）'].concat(TIME) },
        { t: 'radio', q: 'A6. 申請から承認されるまでの平均的な待ち時間', req: true, opts: WAIT },
        { t: 'radio', q: 'A7. POC期間中、承認待ちの間に料金上昇・満席・希望ホテルの売り切れが起きた回数', opts: TIMES },
        { t: 'radio', q: 'A8. POC期間中、金額のずれ等で修正・再申請・差し戻しになった回数', opts: TIMES },
        { t: 'para', q: 'A8補足. 再申請・差し戻しがあった場合、その理由' },
        { t: 'radio', q: 'A9. POC期間中、予定変更・キャンセルが発生した回数', opts: TIMES },
        { t: 'scale', q: 'A10. 予定変更・キャンセル時の手続きの負担感（発生しなかった場合は未回答で可）', low: '負担はない', high: '非常に負担' },
        { t: 'scale', q: 'A11. 運賃・宿泊費の立替の負担感', low: '負担はない', high: '非常に負担' },
        { t: 'check', q: 'A12. 1approvalの流れで手間・ストレスを感じた工程（複数選択可）', req: true, opts: PAIN.map(function (p) { return p.replace('マネーフォワード クラウド経費への稟議入力', '1approvalへの申請入力').replace('承認後に各サイト（スマートEX・楽天トラベル等）で予約し直すこと', '承認後の予約確定作業').replace('稟議と予約サイトへの同じ情報の二重入力', '同じ情報の二重入力'); }), other: true },
        { t: 'scale', q: 'A13. 1approvalでの出張手配〜精算の流れの総合満足度', req: true, low: S5.low, high: S5.high },
        { t: 'radio', q: 'A14. 従来（MF稟議＋各サイトで自己手配）と比べた使いやすさ', req: true, opts: ['1approvalの方がかなり使いやすい', '1approvalの方がやや使いやすい', '変わらない', '従来の方がやや使いやすい', '従来の方がかなり使いやすい'] },
        { t: 'radio', q: 'A15. 新幹線の検索・予約は、スマートEX等と比べていかがでしたか', opts: ['1approvalの方が良い', '同程度', 'スマートEX等の方が良い', '利用していない'] },
        { t: 'radio', q: 'A16. 宿泊の検索・予約は、楽天トラベル等と比べていかがでしたか', opts: ['1approvalの方が良い', '同程度', '楽天トラベル等の方が良い', '利用していない'] },
        { t: 'check', q: 'A17. 不便・分かりにくかった点（複数選択可）', opts: ['新幹線の検索・座席指定', 'ホテルの検索・エリア指定', '申請画面の入力項目', '承認状況の確認', '予約確定・変更・キャンセルの操作', 'スマートフォンでの操作', 'マニュアル・説明', '特になし'], other: true },
        { t: 'para', q: 'A18. 良かった点（自由記述）' }
      ]},
      { id: 'BG', title: '承認者の方へ', items: [
        { t: 'gate', q: 'POC期間中、1approvalで出張申請を承認しましたか？', req: true, go: [['はい', 'B'], ['いいえ', 'CG']] }
      ]},
      { id: 'B', title: '承認者の方へ：1approvalでの承認業務', items: [
        { t: 'radio', q: 'B1. POC期間中の承認件数', req: true, opts: ['1〜2件', '3〜5件', '6〜10件', '11件以上'] },
        { t: 'radio', q: 'B2. 1件あたりの確認・承認にかかった時間', req: true, opts: ['1分未満', '1〜3分', '3〜5分', '5〜10分', '10分以上'] },
        { t: 'check', q: 'B3. 承認時に困ったこと（複数選択可）', opts: ['金額の妥当性が判断しにくい', '規程に合っているか確認が必要', '行程・目的が分かりにくい', '承認後に実際に何を買ったか見えない', '承認依頼に気付くのが遅れる', '特になし'], other: true },
        { t: 'scale', q: 'B4. 1approvalでの承認業務の満足度', req: true, low: S5.low, high: S5.high },
        { t: 'radio', q: 'B5. 従来（MF稟議）と比べ、承認に必要な情報（行程・金額・規程適合）は把握しやすくなりましたか', opts: ['かなり把握しやすくなった', 'やや把握しやすくなった', '変わらない', '把握しにくくなった'] }
      ]},
      { id: 'CG', title: '経理・管理部門の方へ', items: [
        { t: 'gate', q: '出張費の精算チェック・仕訳・支払などを担当していますか？', req: true, go: [['はい', 'C'], ['いいえ', 'D']] }
      ]},
      { id: 'C', title: '経理・管理部門の方へ：精算・経理業務の変化', items: [
        { t: 'radio', q: 'C1. 1approval経由の出張1件あたりのチェック・仕訳・支払処理の時間', req: true, opts: ['3分未満', '3〜5分', '5〜10分', '10〜20分', '20分以上'] },
        { t: 'radio', q: 'C2. POC期間中、1approval経由の出張で差し戻し・確認が必要になった件数', opts: ['0件', '1〜3件', '4〜10件', '11件以上'] },
        { t: 'radio', q: 'C3. 法人一括請求（請求書払い）により、立替精算・領収書確認の手間は減りましたか', opts: ['大幅に減った', 'やや減った', '変わらない', 'かえって増えた'] },
        { t: 'radio', q: 'C4. 申請（承認）内容と実際の手配・請求の突合は容易になりましたか', opts: ['大幅に容易になった', 'やや容易になった', '変わらない', 'かえって手間が増えた'] },
        { t: 'radio', q: 'C5. インボイス（適格請求書）確認の手間は変わりましたか', opts: ['大幅に減った', 'やや減った', '変わらない', 'かえって増えた'] },
        { t: 'check', q: 'C6. 本導入時に必要な連携・データ（複数選択可）', opts: ['マネーフォワード クラウド経費へのデータ連携', '会計ソフト向けCSV出力', '部門・プロジェクト別の集計', '月次の請求明細', '規程違反・例外手配のレポート'], other: true },
        { t: 'para', q: 'C7. 宿泊手当制度・経費規程との整合で気になった点（自由記述）' }
      ]},
      { id: 'D', title: '全員：総合評価と本導入について', items: [
        { t: 'radio', q: 'D1. 本導入する場合、望ましい利用基盤', req: true, opts: ['kintone', 'SharePoint／Teams（Microsoft 365）', 'どちらでもよい', '分からない'] },
        { t: 'check', q: 'D2. 本導入に向けて見直しが必要と思われる社内規定・ルール（複数選択可）', opts: ['宿泊手当制度', '旅費・経費規程', '承認権限規程', '支払方法（請求書払い）', 'マネーフォワード クラウド経費との役割分担', '特になし'], other: true },
        { t: 'radio', q: 'D3. 1approvalを正式導入したいと思いますか', req: true, opts: ['強くそう思う', 'そう思う', '条件次第でそう思う', 'あまり思わない', '思わない'] },
        { t: 'para', q: 'D3補足. 「条件次第」「思わない」の場合、その条件・理由' },
        { t: 'scale', q: 'D4. 1approvalの総合満足度', req: true, low: S5.low, high: S5.high },
        { t: 'nps', q: 'D5. 1approvalを社内の他部署・同僚に勧める可能性はどのくらいありますか（0〜10）', req: true },
        { t: 'check', q: 'D6. 今後、連携・展開を希望するもの（複数選択可）', opts: ['Teams通知・承認', 'SharePoint上での申請', '備品購買（モノタロウ）', '備品購買（オレンジブック）', '備品購買（アスクル）', '社内行事・イベント用品の購買'], other: true },
        { t: 'para', q: 'D7. 開発チームへのご要望・メッセージ（自由記述）' },
        { t: 'radio', q: 'D8. 後日、15〜30分程度のオンラインインタビューにご協力いただけますか', opts: ['協力できる', '協力できない'] }
      ]}
    ]
  }
};

// ===== ビルダー：Apps Script（script.google.com）に貼り付けて createVisPocForms を実行 =====
function createVisPocForms() {
  var pre = buildForm_(SPEC.pre);
  var post = buildForm_(SPEC.post);
  Logger.log('事前 編集URL: ' + pre.getEditUrl());
  Logger.log('事前 回答URL: ' + pre.getPublishedUrl());
  Logger.log('事後 編集URL: ' + post.getEditUrl());
  Logger.log('事後 回答URL: ' + post.getPublishedUrl());
}

function buildForm_(def) {
  var form = FormApp.create(def.title).setDescription(def.description)
    .setProgressBar(true).setAllowResponseEdits(true);
  var breaks = {}, gates = [];
  def.pages.forEach(function (page, i) {
    if (i === 0) form.addSectionHeaderItem().setTitle(page.title);
    else breaks[page.id] = form.addPageBreakItem().setTitle(page.title);
    page.items.forEach(function (it) {
      var item;
      switch (it.t) {
        case 'text': item = form.addTextItem(); break;
        case 'para': item = form.addParagraphTextItem(); break;
        case 'radio': item = form.addMultipleChoiceItem().setChoiceValues(it.opts); if (it.other) item.showOtherOption(true); break;
        case 'check': item = form.addCheckboxItem().setChoiceValues(it.opts); if (it.other) item.showOtherOption(true); break;
        case 'scale': item = form.addScaleItem().setBounds(1, 5).setLabels(it.low, it.high); break;
        case 'nps': item = form.addScaleItem().setBounds(0, 10).setLabels('全く勧めない', '強く勧める'); break;
        case 'gate': item = form.addMultipleChoiceItem(); gates.push({ item: item, go: it.go }); break;
      }
      item.setTitle(it.q);
      if (it.req) item.setRequired(true);
    });
  });
  gates.forEach(function (g) {
    g.item.setChoices(g.go.map(function (c) { return g.item.createChoice(c[0], breaks[c[1]]); }));
  });
  return form;
}
