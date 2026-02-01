/**
 * ═══════════════════════════════════════════════════════════════════════
 * Googleフォーム自動返信システム - 完全版GASコード
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * このコードをApps Scriptエディタに貼り付けてください
 * 
 * 【機能】
 * - フォーム送信時に自動返信メールを送信
 * - 送信済みフラグで重複送信を防止
 * - エラーハンドリング完備
 * - lastRowズレ対策
 * 
 * 【列構成】
 * A列: タイムスタンプ
 * B列: 名前
 * C列: メールアドレス
 * D列: 内容
 * E列: 送信状態（自動追加）
 * 
 * 【トリガー設定】
 * 関数: sendAutoReply
 * イベント: フォーム送信時
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

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

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 設定方法
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 1. このコード全体をコピー
 * 2. スプレッドシート → 拡張機能 → Apps Script
 * 3. 既存のコードを削除して貼り付け
 * 4. 💾 保存
 * 5. testSendEmail を実行してテスト（testEmail変数を編集）
 * 6. トリガー⏰をクリック → ＋トリガーを追加
 *    - 関数: sendAutoReply
 *    - デプロイ: Head
 *    - イベントソース: スプレッドシートから
 *    - イベントタイプ: フォーム送信時
 * 7. 保存して完了！
 * 
 * ═══════════════════════════════════════════════════════════════════════
 * カスタマイズ
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * メール件名を変更:
 *   → const subject = 'フォーム送信を受け付けました'; を編集
 * 
 * メール本文を変更:
 *   → const body = ... の部分を編集
 * 
 * シート名を変更:
 *   → 'フォームの回答 1' を新しいシート名に変更
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */
