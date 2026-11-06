/*
 * 経費精算アプリ一式（勘定科目マスタ・部門マスタ・経費精算）をkintoneに構築するスクリプト
 *
 * 使い方（ログイン済みのブラウザで）：
 *   1. kintoneのポータルなど任意の画面（https://<sub>.cybozu.com/k/ 配下）を開く
 *   2. 開発者ツールのコンソールにこのファイルの中身をすべて貼り付けて実行
 *   3. 次の順に1つずつ実行し、毎回kintoneの画面で結果を確認してから次へ進む
 *        await expenseBuild.step1()   // 勘定科目マスタ（作成・反映・初期データ）
 *        await expenseBuild.step2()   // 部門マスタ（作成・反映・初期データ）
 *        await expenseBuild.step3()   // 経費精算（フィールド・プロセス管理・権限・一覧・JS）
 *        await expenseBuild.test()    // テスト1件：下書き→上長承認待ち→経理確認待ち→精算確定
 *        expenseBuild.state()         // 作成したアプリIDの確認
 *
 * ・ログイン中ユーザーの権限で動きます。kintoneシステム管理者（Administrators）で実行してください。
 * ・既存アプリは変更・削除しません。同名アプリがあれば作らずに止まります。
 * ・作成したアプリIDはブラウザの localStorage（expenseBuild）に保存し、次のステップで使います。
 */
(function () {
  'use strict';

  const NAMES = {
    account: '勘定科目マスタ（経費精算）',
    dept: '部門マスタ（経費精算）',
    expense: '経費精算（DenHo連携）',
  };
  const ADMIN_GROUP = 'Administrators'; // 経理グループの代用
  const STORE_KEY = 'expenseBuild';

  // ---------- 共通 ----------
  const log = (...a) => console.log('%c[expenseBuild]', 'color:#0a7', ...a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function api(path, method, body) {
    return kintone.api(kintone.api.url(path, true), method, body || {}).catch((e) => {
      console.error('[expenseBuild] API error', method, path, body, e);
      throw e;
    });
  }
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
    log('state', s);
  }
  function appUrl(id) { return location.origin + '/k/' + id + '/'; }

  async function assertNoSameName(name) {
    const res = await api('/k/v1/apps', 'GET', { name: name, limit: 100 });
    const same = res.apps.filter((a) => a.name === name);
    if (same.length) {
      const ids = same.map((a) => a.appId + ' ' + appUrl(a.appId)).join(', ');
      throw new Error('同名アプリが既にあるため作成を中止しました：「' + name + '」 → ' + ids);
    }
  }

  async function createApp(name) {
    await assertNoSameName(name);
    const res = await api('/k/v1/preview/app', 'POST', { name: name });
    log('アプリ作成（未反映）', name, 'id=' + res.app);
    return Number(res.app);
  }

  async function deploy(app) {
    await api('/k/v1/preview/app/deploy', 'POST', { apps: [{ app: app }] });
    for (let i = 0; i < 120; i++) {
      await sleep(1500);
      const r = await api('/k/v1/preview/app/deploy', 'GET', { apps: [app] });
      const st = r.apps[0].status;
      if (st === 'SUCCESS') { log('アプリを更新しました（反映完了）', app); return; }
      if (st === 'FAIL' || st === 'CANCEL') throw new Error('反映に失敗しました：app=' + app + ' status=' + st);
    }
    throw new Error('反映がタイムアウトしました：app=' + app);
  }

  async function addFields(app, properties) {
    await api('/k/v1/preview/app/form/fields', 'POST', { app: app, properties: properties });
  }

  function opts(list) {
    const o = {};
    list.forEach((label, i) => { o[label] = { label: label, index: String(i) }; });
    return o;
  }
  const text = (code, label, extra) => Object.assign({ type: 'SINGLE_LINE_TEXT', code, label }, extra || {});
  const autoText = (code, label, expression) => text(code, label, { expression, hideExpression: false });
  const check = (code, label, choice, on) => ({
    type: 'CHECK_BOX', code, label, options: opts([choice]), defaultValue: on ? [choice] : [], align: 'HORIZONTAL',
  });
  const user = (code, label, required, loginDefault) => ({
    type: 'USER_SELECT', code, label, required: !!required,
    defaultValue: loginDefault ? [{ type: 'FUNCTION', code: 'LOGINUSER()' }] : [],
  });

  // ---------- ステップ1：勘定科目マスタ ----------
  async function step1() {
    const s = loadState();
    if (s.account) { log('勘定科目マスタは作成済みです', s.account, appUrl(s.account)); return s.account; }
    const app = await createApp(NAMES.account);
    s.account = app; saveState(s);
    await addFields(app, {
      account_name: text('account_name', '勘定科目名', { required: true }),
      account_code: text('account_code', '勘定科目コード', { required: true, unique: true }),
      tax_code: text('tax_code', '税区分コード'),
      receipt_required: check('receipt_required', '領収書必須', '必須', true),
      active: check('active', '使用中', '使用中', true),
    });
    await deploy(app);
    const rows = [
      ['旅費交通費', '7410', '31', true],
      ['交際費', '7420', '31', true],
      ['会議費', '7430', '31', true],
      ['消耗品費', '7440', '31', true],
      ['通信費', '7450', '31', true],
      ['新聞図書費', '7460', '31', true],
      ['日当（旅費交通費）', '7411', '00', false],
    ];
    await api('/k/v1/records', 'POST', {
      app: app,
      records: rows.map(([name, code, tax, rr]) => ({
        account_name: { value: name },
        account_code: { value: code },
        tax_code: { value: tax },
        receipt_required: { value: rr ? ['必須'] : [] },
        active: { value: ['使用中'] },
      })),
    });
    log('勘定科目マスタ完了：初期データ' + rows.length + '件', appUrl(app));
    return app;
  }

  // ---------- ステップ2：部門マスタ ----------
  async function step2() {
    const s = loadState();
    if (s.dept) { log('部門マスタは作成済みです', s.dept, appUrl(s.dept)); return s.dept; }
    const app = await createApp(NAMES.dept);
    s.dept = app; saveState(s);
    await addFields(app, {
      dept_name: text('dept_name', '部門名', { required: true }),
      dept_code: text('dept_code', '部門コード', { required: true, unique: true }),
      org: { type: 'ORGANIZATION_SELECT', code: 'org', label: 'kintone組織' },
    });
    await deploy(app);
    await api('/k/v1/records', 'POST', {
      app: app,
      records: [['管理部', '100'], ['営業部', '200'], ['開発部', '300']].map(([n, c]) => ({
        dept_name: { value: n }, dept_code: { value: c },
      })),
    });
    log('部門マスタ完了：初期データ3件', appUrl(app));
    return app;
  }

  // ---------- ステップ3：経費精算 ----------
  const CATEGORIES = ['交通費', '宿泊費', '交際費', '会議費', '消耗品・備品', '通信費', 'その他'];
  const PAY_METHODS = ['立替', '法人カード', '請求書払い'];

  function expenseFields() {
    const lines = {
      receipt: { type: 'FILE', code: 'receipt', label: '領収書' },
      tx_date: { type: 'DATE', code: 'tx_date', label: '取引日付' },
      category: { type: 'DROP_DOWN', code: 'category', label: '経費区分', required: true, options: opts(CATEGORIES) },
      pay_method: { type: 'DROP_DOWN', code: 'pay_method', label: '支払方法', required: true, options: opts(PAY_METHODS), defaultValue: '立替' },
      account_name_c: text('account_name_c', '勘定科目名'),
      tax_code: text('tax_code', '税区分コード'),
      receipt_req_c: check('receipt_req_c', '領収書必須', '必須', false),
      vendor: text('vendor', '取引先'),
      amount: { type: 'NUMBER', code: 'amount', label: '金額（税込）', required: true, digit: true, unit: '円', unitPosition: 'AFTER' },
      invoice_no: text('invoice_no', 'インボイス登録番号'),
      memo: text('memo', '用途・摘要', { required: true }),
      from_place: text('from_place', '出発'),
      to_place: text('to_place', '到着'),
      round_trip: check('round_trip', '往復', '往復', false),
      attendees: { type: 'NUMBER', code: 'attendees', label: '参加人数', unit: '人', unitPosition: 'AFTER' },
      guests: { type: 'MULTI_LINE_TEXT', code: 'guests', label: '参加者（社外の会社名・氏名）' },
      per_person: { type: 'CALC', code: 'per_person', label: '1人あたり金額', expression: 'IF(attendees>0, ROUNDDOWN(amount/attendees,0), 0)', format: 'NUMBER_DIGIT', unit: '円', unitPosition: 'AFTER' },
      reimb_amount: { type: 'CALC', code: 'reimb_amount', label: '振込対象額', expression: 'IF(pay_method="立替", amount, 0)', format: 'NUMBER_DIGIT', unit: '円', unitPosition: 'AFTER' },
      credit_code_l: autoText('credit_code_l', '貸方科目コード', 'IF(pay_method="法人カード","2120","2110")'),
      policy_check: autoText('policy_check', '規程チェック', 'IF(OR(AND(category="交際費", per_person>10000), amount>30000),"要確認","")'),
      journal_memo: autoText('journal_memo', '仕訳摘要', 'vendor & " " & memo'),
      denho_url: { type: 'LINK', code: 'denho_url', label: 'DenHoリンク', protocol: 'WEB' },
    };
    return {
      title: text('title', '申請タイトル', { required: true }),
      app_no: autoText('app_no', '申請番号', '"EXP-" & レコード番号'),
      applicant: user('applicant', '申請者', true, true),
      payee: user('payee', '精算対象者', true, true),
      approver: user('approver', '承認者（上長）', true, false),
      approver2: user('approver2', '部長承認者（5万円以上）', false, false),
      dept_name_c: text('dept_name_c', '部門名'),
      trip_no: text('trip_no', '出張申請番号'),
      settle_date: { type: 'DATE', code: 'settle_date', label: '精算日' },
      exported: check('exported', '仕訳出力済み', '出力済み', false),
      lines: { type: 'SUBTABLE', code: 'lines', label: '明細', fields: lines },
      total: { type: 'CALC', code: 'total', label: '合計金額', expression: 'SUM(amount)', format: 'NUMBER_DIGIT', unit: '円', unitPosition: 'AFTER' },
      transfer_total: { type: 'CALC', code: 'transfer_total', label: '振込額', expression: 'SUM(reimb_amount)', format: 'NUMBER_DIGIT', unit: '円', unitPosition: 'AFTER' },
    };
  }

  function lookupFields(s, form) {
    const lines = form.lines.fields;
    // 既存のサブテーブル定義に account を足して丸ごと更新する
    lines.account = {
      type: 'SINGLE_LINE_TEXT', code: 'account', label: '勘定科目コード', required: false,
      lookup: {
        relatedApp: { app: String(s.account) },
        relatedKeyField: 'account_code',
        fieldMappings: [
          { field: 'account_name_c', relatedField: 'account_name' },
          { field: 'tax_code', relatedField: 'tax_code' },
          { field: 'receipt_req_c', relatedField: 'receipt_required' },
        ],
        lookupPickerFields: ['account_code', 'account_name', 'tax_code', 'receipt_required'],
        filterCond: 'active in ("使用中")',
        sort: 'account_code asc',
      },
    };
    return {
      dept: {
        type: 'SINGLE_LINE_TEXT', code: 'dept', label: '部門コード',
        lookup: {
          relatedApp: { app: String(s.dept) },
          relatedKeyField: 'dept_code',
          fieldMappings: [{ field: 'dept_name_c', relatedField: 'dept_name' }],
          lookupPickerFields: ['dept_code', 'dept_name'],
          filterCond: '',
          sort: 'dept_code asc',
        },
      },
      lines: form.lines,
    };
  }

  function layout() {
    const row = (...codes) => ({ type: 'ROW', fields: codes.map((c) => ({ type: 'FIELD', code: c })) });
    return [
      row('app_no', 'title'),
      row('applicant', 'payee', 'dept', 'dept_name_c'),
      row('approver', 'approver2', 'trip_no'),
      {
        type: 'SUBTABLE', code: 'lines',
        fields: ['receipt', 'tx_date', 'category', 'pay_method', 'account', 'account_name_c', 'tax_code', 'receipt_req_c',
          'vendor', 'amount', 'invoice_no', 'memo', 'from_place', 'to_place', 'round_trip', 'attendees', 'guests',
          'per_person', 'reimb_amount', 'credit_code_l', 'policy_check', 'journal_memo', 'denho_url'].map((c) => ({ type: 'FIELD', code: c })),
      },
      row('total', 'transfer_total'),
      row('settle_date', 'exported'),
    ];
  }

  function processSettings(app) {
    const one = (entity) => ({ type: 'ONE', entities: entity ? [{ entity: entity, includeSubs: false }] : [] });
    const any = (entity) => ({ type: 'ANY', entities: [{ entity: entity, includeSubs: false }] });
    const st = (name, index, assignee) => ({ name, index: String(index), assignee });
    const admins = { type: 'GROUP', code: ADMIN_GROUP };
    return {
      app: app,
      enable: true,
      states: {
        '下書き': st('下書き', 0, one({ type: 'CREATOR' })),
        '上長承認待ち': st('上長承認待ち', 1, one({ type: 'FIELD_ENTITY', code: 'approver' })),
        '部長承認待ち': st('部長承認待ち', 2, one({ type: 'FIELD_ENTITY', code: 'approver2' })),
        '経理確認待ち': st('経理確認待ち', 3, any(admins)),
        '精算確定': st('精算確定', 4, any(admins)),
        '完了': st('完了', 5, one(null)),
      },
      actions: [
        { name: '申請する', from: '下書き', to: '上長承認待ち', filterCond: 'total > 0' },
        { name: '承認する', from: '上長承認待ち', to: '経理確認待ち', filterCond: 'total < 50000' },
        { name: '承認する（部長へ）', from: '上長承認待ち', to: '部長承認待ち', filterCond: 'total >= 50000' },
        { name: '差し戻す', from: '上長承認待ち', to: '下書き', filterCond: '' },
        { name: '部長が承認する', from: '部長承認待ち', to: '経理確認待ち', filterCond: '' },
        { name: '差し戻す', from: '部長承認待ち', to: '下書き', filterCond: '' },
        { name: '確認完了', from: '経理確認待ち', to: '精算確定', filterCond: 'settle_date >= "2000-01-01"' },
        { name: '差し戻す', from: '経理確認待ち', to: '下書き', filterCond: '' },
        { name: '仕訳出力済みにする', from: '精算確定', to: '完了', filterCond: '' },
      ],
    };
  }

  function appAcl(app) {
    const r = (entity, x) => Object.assign({
      entity, includeSubs: false, appEditable: false, recordViewable: true, recordAddable: true,
      recordEditable: true, recordDeletable: false, recordImportable: false, recordExportable: false,
    }, x || {});
    return {
      app: app,
      rights: [
        r({ type: 'GROUP', code: ADMIN_GROUP }, { appEditable: true, recordImportable: true, recordExportable: true }),
        r({ type: 'CREATOR' }, { appEditable: true }),
        r({ type: 'GROUP', code: 'everyone' }),
      ],
    };
  }

  function recordAcl(app) {
    const ent = (type, code, v, e) => ({ entity: { type, code }, viewable: v, editable: e, deletable: false, includeSubs: false });
    const people = (editable) => ['作成者', 'applicant', 'payee', 'approver', 'approver2'].map((c) => ent('FIELD_ENTITY', c, true, editable));
    return {
      app: app,
      rights: [
        { filterCond: 'ステータス in ("精算確定", "完了")', entities: [ent('GROUP', ADMIN_GROUP, true, true)].concat(people(false)) },
        { filterCond: '', entities: [ent('GROUP', ADMIN_GROUP, true, true)].concat(people(true)) },
      ],
    };
  }

  function fieldAcl(app) {
    const rule = (code) => ({
      code,
      entities: [
        { accessibility: 'WRITE', entity: { type: 'GROUP', code: ADMIN_GROUP }, includeSubs: false },
        { accessibility: 'READ', entity: { type: 'GROUP', code: 'everyone' }, includeSubs: false },
      ],
    });
    return { app: app, rights: [rule('settle_date'), rule('exported')] };
  }

  function views(app) {
    const cols = ['app_no', 'title', 'applicant', 'payee', 'dept_name_c', 'total', 'transfer_total', 'settle_date', 'exported'];
    const v = (name, index, filterCond) => ({ type: 'LIST', name, index: String(index), fields: cols, filterCond, sort: 'レコード番号 desc' });
    return {
      app: app,
      views: {
        '自分の申請': v('自分の申請', 0, '作成者 in (LOGINUSER())'),
        '承認待ち': v('承認待ち', 1, '作業者 in (LOGINUSER())'),
        '仕訳出力対象': v('仕訳出力対象', 2, 'ステータス in ("精算確定") and exported not in ("出力済み")'),
        'すべて': v('すべて', 3, ''),
      },
    };
  }

  async function uploadFile(name, content) {
    const fd = new FormData();
    fd.append('__REQUEST_TOKEN__', kintone.getRequestToken());
    fd.append('file', new Blob([content], { type: 'text/javascript' }), name);
    const res = await fetch('/k/v1/file.json', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' }, body: fd, credentials: 'same-origin' });
    const json = await res.json();
    if (!res.ok) throw new Error('JSファイルのアップロードに失敗：' + JSON.stringify(json));
    return json.fileKey;
  }

  async function step3() {
    const s = loadState();
    if (!s.account || !s.dept) throw new Error('先に step1()・step2() を実行してください');
    if (s.expenseDone) { log('経費精算は作成済みです', s.expense, appUrl(s.expense)); return s.expense; }
    let app = s.expense;
    if (!app) { app = await createApp(NAMES.expense); s.expense = app; saveState(s); }

    if (!s.expFields) {
      const form = expenseFields();
      const lk = lookupFields(s, expenseFields());
      try {
        // まずルックアップを含めて1回で追加する
        await addFields(app, Object.assign({}, form, lk));
      } catch (e) {
        // 失敗したら、コピー先を先に作ってからルックアップを足す
        log('一括追加に失敗したため段階的に追加します', e && e.message);
        await addFields(app, form);
        await addFields(app, { dept: lk.dept });
        await api('/k/v1/preview/app/form/fields', 'PUT', { app: app, properties: { lines: lk.lines } });
      }
      s.expFields = true; saveState(s);
      log('フィールド・ルックアップ（部門・勘定科目）を追加');
    }
    await api('/k/v1/preview/app/form/layout', 'PUT', { app: app, layout: layout() });
    await deploy(app); // フィールドを反映してから、プロセス管理・権限・一覧を設定する

    await api('/k/v1/preview/app/status', 'PUT', processSettings(app));
    log('プロセス管理を設定');
    await deploy(app);

    await api('/k/v1/preview/app/views', 'PUT', views(app));
    await api('/k/v1/preview/app/acl', 'PUT', appAcl(app));
    await api('/k/v1/preview/record/acl', 'PUT', recordAcl(app));
    await api('/k/v1/preview/field/acl', 'PUT', fieldAcl(app));
    log('一覧・アプリ／レコード／フィールドのアクセス権を設定');

    const src = '(' + customizeSource.toString() + ')();\n';
    const fileKeyPc = await uploadFile('expense-customize.js', src);
    const fileKeyMb = await uploadFile('expense-customize-mobile.js', src);
    await api('/k/v1/preview/app/customize', 'PUT', {
      app: app, scope: 'ALL',
      desktop: { js: [{ type: 'FILE', file: { fileKey: fileKeyPc } }], css: [] },
      mobile: { js: [{ type: 'FILE', file: { fileKey: fileKeyMb } }], css: [] },
    });
    log('JavaScriptカスタマイズ（PC・モバイル）を適用');
    await deploy(app);

    s.expenseDone = true; saveState(s);
    log('経費精算アプリ完了', appUrl(app));
    return app;
  }

  // ---------- テスト：下書き→上長承認待ち→経理確認待ち→精算確定 ----------
  async function test() {
    const s = loadState();
    if (!s.expenseDone) throw new Error('先に step3() を実行してください');
    const me = kintone.getLoginUser().code;
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const add = await api('/k/v1/record', 'POST', {
      app: s.expense,
      record: {
        title: { value: 'テスト申請（構築確認用）' },
        applicant: { value: [{ code: me }] },
        payee: { value: [{ code: me }] },
        approver: { value: [{ code: me }] },
        dept: { value: '100' },
        lines: {
          value: [{
            value: {
              tx_date: { value: today },
              category: { value: '会議費' },
              pay_method: { value: '立替' },
              account: { value: '7430' },
              vendor: { value: 'テスト商店' },
              amount: { value: '3300' },
              memo: { value: '打合せ用飲料' },
              attendees: { value: '3' },
            },
          }],
        },
      },
    });
    const id = add.id;
    log('テストレコード作成 id=' + id);
    const status = async () => (await api('/k/v1/record', 'GET', { app: s.expense, id })).record['ステータス'].value;
    log('ステータス：', await status());
    await api('/k/v1/record/status', 'PUT', { app: s.expense, id, action: '申請する' });
    log('ステータス：', await status());
    await api('/k/v1/record/status', 'PUT', { app: s.expense, id, action: '承認する' });
    log('ステータス：', await status());
    await api('/k/v1/record', 'PUT', { app: s.expense, id, record: { settle_date: { value: today } } });
    await api('/k/v1/record/status', 'PUT', { app: s.expense, id, action: '確認完了' });
    const fin = await status();
    log('ステータス：', fin);
    const rec = (await api('/k/v1/record', 'GET', { app: s.expense, id })).record;
    const line = rec.lines.value[0].value;
    log('ルックアップ確認：勘定科目名=' + line.account_name_c.value + ' 税区分=' + line.tax_code.value +
      ' 部門名=' + rec.dept_name_c.value + ' 申請番号=' + rec.app_no.value + ' 合計=' + rec.total.value);
    if (fin !== '精算確定') throw new Error('精算確定まで進みませんでした：' + fin);
    log('テスト成功', appUrl(s.expense) + 'show#record=' + id);
    return id;
  }

  // ---------- 経費精算アプリに適用するJavaScript（PC・モバイル共通） ----------
  function customizeSource() {
    'use strict';
    var APPROVER2_LIMIT = 50000;
    var empty = function (f) { return !f || f.value === '' || f.value === null || (Array.isArray(f.value) && f.value.length === 0); };

    function validate(record) {
      var errors = [];
      var sum = 0;
      (record.lines.value || []).forEach(function (row, i) {
        var r = row.value;
        sum += Number(r.amount.value || 0);
        var n = (i + 1) + '行目';
        if (r.category.value === '交通費') {
          if (empty(r.from_place)) { r.from_place.error = '交通費は出発が必須です'; errors.push(n + '：出発'); }
          if (empty(r.to_place)) { r.to_place.error = '交通費は到着が必須です'; errors.push(n + '：到着'); }
        }
        if (r.category.value === '交際費') {
          if (empty(r.attendees) || Number(r.attendees.value) <= 0) { r.attendees.error = '交際費は参加人数が必須です'; errors.push(n + '：参加人数'); }
          if (empty(r.guests)) { r.guests.error = '交際費は参加者が必須です'; errors.push(n + '：参加者'); }
        }
      });
      if (sum >= APPROVER2_LIMIT && empty(record.approver2)) {
        record.approver2.error = '合計5万円以上は部長承認者が必須です';
        errors.push('部長承認者');
      }
      return errors;
    }

    kintone.events.on([
      'app.record.create.submit', 'app.record.edit.submit', 'app.record.index.edit.submit',
      'mobile.app.record.create.submit', 'mobile.app.record.edit.submit',
    ], function (event) {
      var errors = validate(event.record);
      if (errors.length) event.error = '入力が不足しています：' + errors.join('、');
      return event;
    });

    kintone.events.on(['app.record.detail.process.proceed', 'mobile.app.record.detail.process.proceed'], function (event) {
      if (event.action.value !== '申請する') return event;
      var record = event.record;
      var errors = validate(record);
      var policy = [];
      (record.lines.value || []).forEach(function (row, i) {
        var r = row.value;
        if (r.receipt_req_c.value.indexOf('必須') >= 0 && empty(r.receipt)) errors.push((i + 1) + '行目：領収書の添付');
        if (r.policy_check.value === '要確認') policy.push((i + 1) + '行目');
      });
      if (errors.length) { event.error = '申請できません：' + errors.join('、'); return event; }
      if (policy.length && !window.confirm('規程チェックで「要確認」の明細があります（' + policy.join('、') + '）。\nこのまま申請しますか？')) {
        event.error = '申請を中止しました';
      }
      return event;
    });

    kintone.events.on(['app.record.detail.show', 'mobile.app.record.detail.show'], function (event) {
      var count = (event.record.lines.value || []).filter(function (row) { return row.value.policy_check.value === '要確認'; }).length;
      if (!count) return event;
      var isMobile = event.type.indexOf('mobile.') === 0;
      var space = isMobile ? kintone.mobile.app.getHeaderSpaceElement() : kintone.app.record.getHeaderMenuSpaceElement();
      if (!space || space.querySelector('.exp-policy-badge')) return event;
      var badge = document.createElement('span');
      badge.className = 'exp-policy-badge';
      badge.textContent = '規程チェック：要確認の明細 ' + count + '件';
      badge.style.cssText = 'display:inline-block;margin:8px;padding:4px 10px;border-radius:4px;background:#fdecea;color:#b71c1c;font-weight:bold;';
      space.appendChild(badge);
      return event;
    });
  }

  window.expenseBuild = {
    step1, step2, step3, test,
    state: () => { const s = loadState(); ['account', 'dept', 'expense'].forEach((k) => s[k] && log(NAMES[k], s[k], appUrl(s[k]))); return s; },
    reset: () => { localStorage.removeItem(STORE_KEY); log('保存したIDを消しました（アプリ自体は消えません）'); },
    customizeSource,
  };
  log('読み込み完了。await expenseBuild.step1() から順に実行してください。');
})();
