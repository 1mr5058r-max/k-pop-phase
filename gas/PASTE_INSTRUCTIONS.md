# Apps Scriptへのコード貼り付け手順

## 📋 この手順でやること

Googleフォーム自動返信システムのコードをApps Scriptエディタに貼り付けます。

---

## ⚠️ 事前準備

1. Googleフォームとスプレッドシートが連携済みであること
2. スプレッドシートのシート名が「フォームの回答 1」であること
3. 列構成が以下であること：
   - A列：タイムスタンプ
   - B列：名前
   - C列：メールアドレス
   - D列：内容

---

## 🚀 手順1: Apps Scriptエディタを開く

1. Googleスプレッドシートを開く
2. メニューから「**拡張機能**」→「**Apps Script**」をクリック
3. 新しいタブでApps Scriptエディタが開きます

---

## 📝 手順2: Code.gs を貼り付ける

### 2-1. 既存コードを削除

Apps Scriptエディタに表示されている既存のコード（`function myFunction() {}` など）を**すべて削除**してください。

### 2-2. 以下のコードをコピーして貼り付ける

**👇 ここから下のコードをすべてコピーしてApps Scriptエディタに貼り付けてください 👇**

```javascript
/**
 * フォーム送信時に自動返信メールを送信する関数
 * この関数はフォーム送信トリガーで実行されます
 */
function sendAutoReply(e) {
  try {
    // スプレッドシートとシートを取得
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('フォームの回答 1');
    
    if (!sheet) {
      Logger.log('エラー: シート「フォームの回答 1」が見つかりません');
      return;
    }
    
    // 最終行を取得（データがある最後の行）
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      Logger.log('データが存在しません');
      return;
    }
    
    // 送信済みフラグ列（E列）を確認・初期化
    if (sheet.getRange('E1').getValue() === '') {
      sheet.getRange('E1').setValue('送信状態');
    }
    
    // 最新行のデータを取得
    const timestamp = sheet.getRange(lastRow, 1).getValue();
    const name = sheet.getRange(lastRow, 2).getValue();
    const email = sheet.getRange(lastRow, 3).getValue();
    const content = sheet.getRange(lastRow, 4).getValue();
    const sentFlag = sheet.getRange(lastRow, 5).getValue();
    
    // すでに送信済みの場合はスキップ
    if (sentFlag === '送信済み') {
      Logger.log('行' + lastRow + 'は既に送信済みです');
      return;
    }
    
    // メールアドレスの検証
    if (!email || email.toString().indexOf('@') === -1) {
      Logger.log('エラー: 有効なメールアドレスがありません - 行' + lastRow);
      sheet.getRange(lastRow, 5).setValue('送信失敗（無効なメール）');
      return;
    }
    
    // メール本文を作成
    const subject = 'フォーム送信を受け付けました';
    const body = 
      name + ' 様\n\n' +
      'フォームへのご回答ありがとうございます。\n' +
      '以下の内容で受け付けました。\n\n' +
      '【受付内容】\n' +
      '送信日時: ' + timestamp + '\n' +
      'お名前: ' + name + '\n' +
      '内容: ' + content + '\n\n' +
      'ご不明な点がございましたら、このメールに返信してください。\n\n' +
      '※このメールは自動送信されています。';
    
    // MailAppで送信
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body
    });
    
    // 送信済みフラグを立てる
    sheet.getRange(lastRow, 5).setValue('送信済み');
    
    Logger.log('メール送信完了: ' + email + ' (行' + lastRow + ')');
    
  } catch (error) {
    Logger.log('エラーが発生しました: ' + error.message);
    
    // エラーログをシートに記録（可能な場合）
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('フォームの回答 1');
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 5).setValue('送信失敗: ' + error.message);
    } catch (innerError) {
      Logger.log('エラーログの記録に失敗: ' + innerError.message);
    }
  }
}

/**
 * 未送信の行を一括処理する関数（手動実行用）
 * 過去の未送信データをまとめて処理したい場合に使用
 */
function processUnsentRows() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('フォームの回答 1');
    
    if (!sheet) {
      Logger.log('エラー: シート「フォームの回答 1」が見つかりません');
      return;
    }
    
    // ヘッダー行の確認
    if (sheet.getRange('E1').getValue() === '') {
      sheet.getRange('E1').setValue('送信状態');
    }
    
    const lastRow = sheet.getLastRow();
    let processedCount = 0;
    let errorCount = 0;
    
    // 2行目から最終行まで処理
    for (let i = 2; i <= lastRow; i++) {
      const sentFlag = sheet.getRange(i, 5).getValue();
      
      // 未送信の行のみ処理
      if (sentFlag !== '送信済み') {
        try {
          const timestamp = sheet.getRange(i, 1).getValue();
          const name = sheet.getRange(i, 2).getValue();
          const email = sheet.getRange(i, 3).getValue();
          const content = sheet.getRange(i, 4).getValue();
          
          // メールアドレスの検証
          if (!email || email.toString().indexOf('@') === -1) {
            Logger.log('スキップ: 無効なメールアドレス - 行' + i);
            sheet.getRange(i, 5).setValue('送信失敗（無効なメール）');
            errorCount++;
            continue;
          }
          
          // メール本文を作成
          const subject = 'フォーム送信を受け付けました';
          const body = 
            name + ' 様\n\n' +
            'フォームへのご回答ありがとうございます。\n' +
            '以下の内容で受け付けました。\n\n' +
            '【受付内容】\n' +
            '送信日時: ' + timestamp + '\n' +
            'お名前: ' + name + '\n' +
            '内容: ' + content + '\n\n' +
            'ご不明な点がございましたら、このメールに返信してください。\n\n' +
            '※このメールは自動送信されています。';
          
          // MailAppで送信
          MailApp.sendEmail({
            to: email,
            subject: subject,
            body: body
          });
          
          // 送信済みフラグを立てる
          sheet.getRange(i, 5).setValue('送信済み');
          processedCount++;
          
          Logger.log('メール送信完了: ' + email + ' (行' + i + ')');
          
          // Gmail送信制限を考慮して少し待機
          Utilities.sleep(1000);
          
        } catch (rowError) {
          Logger.log('行' + i + 'の処理でエラー: ' + rowError.message);
          sheet.getRange(i, 5).setValue('送信失敗: ' + rowError.message);
          errorCount++;
        }
      }
    }
    
    Logger.log('処理完了: ' + processedCount + '件送信、' + errorCount + '件エラー');
    
  } catch (error) {
    Logger.log('一括処理エラー: ' + error.message);
  }
}

/**
 * テスト送信関数（動作確認用）
 * トリガー設定前の動作確認に使用
 */
function testSendEmail() {
  const testEmail = 'your-email@example.com'; // ここにテスト用のメールアドレスを入力
  
  try {
    MailApp.sendEmail({
      to: testEmail,
      subject: 'テスト送信',
      body: 'これはテスト送信です。メールが正常に送信されました。'
    });
    
    Logger.log('テストメール送信完了: ' + testEmail);
    Browser.msgBox('テストメール送信完了', 'メールが ' + testEmail + ' に送信されました。', Browser.Buttons.OK);
    
  } catch (error) {
    Logger.log('テストメール送信失敗: ' + error.message);
    Browser.msgBox('エラー', 'メール送信に失敗しました: ' + error.message, Browser.Buttons.OK);
  }
}
```

**👆 ここまでコピー 👆**

### 2-3. 保存する

1. 💾マークをクリック（またはCtrl+S / Cmd+S）
2. ファイル名を「**Code.gs**」のままにする
3. プロジェクト名を分かりやすい名前に変更（例：「フォーム自動返信」）

---

## ⚙️ 手順3: appsscript.json を設定（オプション）

**この手順は省略可能です。** 設定したい場合のみ実行してください。

### 3-1. appsscript.json を表示

1. Apps Scriptエディタの左側メニューから「**プロジェクトの設定**」（歯車⚙️マーク）をクリック
2. 「**appsscript.json マニフェスト ファイルをエディタで表示する**」をオン
3. 左側のファイル一覧に「**appsscript.json**」が表示されるのでクリック

### 3-2. 以下の内容に置き換える

```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

### 3-3. 保存する

💾マークをクリックして保存

---

## 🧪 手順4: テスト実行

### 4-1. testSendEmail を編集

1. Code.gs の `testSendEmail` 関数内の以下の行を編集：
   ```javascript
   const testEmail = 'your-email@example.com'; // ← 自分のメールアドレスに変更
   ```

2. 例：
   ```javascript
   const testEmail = 'tanaka@example.com';
   ```

### 4-2. 実行する

1. エディタ上部の関数選択ドロップダウンから「**testSendEmail**」を選択
2. ▶**実行**ボタンをクリック
3. 初回実行時は権限の承認が必要：
   - 「**権限を確認**」をクリック
   - Googleアカウントを選択
   - 「**詳細を表示**」をクリック（警告が出る場合）
   - 「**（プロジェクト名）に移動**」をクリック
   - 「**許可**」をクリック

### 4-3. 確認

1. 実行が完了すると、ダイアログが表示されます
2. 指定したメールアドレスにテストメールが届くことを確認

---

## 🔔 手順5: トリガーを設定

### 5-1. トリガー管理画面を開く

1. Apps Scriptエディタ左側のメニューから「**トリガー**」（時計マーク⏰）をクリック

### 5-2. トリガーを追加

1. 右下の「**＋トリガーを追加**」ボタンをクリック
2. 以下のように設定：

| 設定項目 | 選択する値 |
|---------|-----------|
| 実行する関数を選択 | `sendAutoReply` |
| 実行するデプロイを選択 | `Head` |
| イベントのソースを選択 | `スプレッドシートから` |
| イベントの種類を選択 | `フォーム送信時` |
| エラー通知設定 | `今すぐ通知を受け取る` |

3. 「**保存**」をクリック
4. 権限の承認を求められた場合は、手順4と同様に承認

---

## ✅ 手順6: 動作確認

### 6-1. フォームから送信

1. Googleフォームから実際に回答を送信

### 6-2. 確認ポイント

- ✅ スプレッドシートの最新行に回答が追加される
- ✅ E列（送信状態）に「**送信済み**」と表示される
- ✅ フォームで入力したメールアドレスに自動返信メールが届く

---

## 🎉 完了！

これで設定は完了です。今後、フォームが送信されるたびに自動的に返信メールが送信されます。

---

## 📚 参考情報

- メール本文をカスタマイズしたい → Code.gs の `const subject` と `const body` の部分を編集
- 過去の未送信データを処理したい → 関数選択で `processUnsentRows` を選択して実行
- トラブルが発生した → `README_GAS.md` の「よくある失敗ポイント」を参照

---

## ❓ よくある質問

**Q: メールが届きません**
→ README_GAS.md の「よくある失敗ポイント」を確認してください

**Q: 同じメールが何度も送信されます**
→ トリガーが重複していないか確認してください（トリガー画面で確認）

**Q: シート名を変更したい**
→ Code.gs の `'フォームの回答 1'` をすべて新しいシート名に変更してください

---

**サポートが必要な場合は、README_GAS.md または QUICK_START.md を参照してください。**
