/**
 * ========================================
 * Google Apps Script - フォーム自動応答システム
 * ========================================
 * 
 * 【トリガー設定手順】
 * 
 * 1. sendAutoReply 関数用のトリガー設定：
 *    - スクリプトエディタで「トリガー」（時計アイコン）をクリック
 *    - 右下の「トリガーを追加」をクリック
 *    - 実行する関数: sendAutoReply
 *    - イベントのソース: スプレッドシートから
 *    - イベントの種類: フォーム送信時
 *    - 「保存」をクリック
 * 
 * 2. onEditTrigger 関数用のトリガー設定：
 *    - スクリプトエディタで「トリガー」（時計アイコン）をクリック
 *    - 右下の「トリガーを追加」をクリック
 *    - 実行する関数: onEditTrigger
 *    - イベントのソース: スプレッドシートから
 *    - イベントの種類: 編集時
 *    - 「保存」をクリック
 * 
 * ========================================
 */

/**
 * 機能①：フォーム送信時の自動返信メール送信
 * 
 * 【動作概要】
 * - フォーム送信時トリガーで自動実行
 * - 最新行のデータを取得し、自動返信メールを送信
 * - お問い合わせ種別に応じて本文を条件分岐
 * - 重複送信を防止（F列のステータスで判定）
 * - 送信後、F列を「未対応」にセット
 */
function sendAutoReply() {
  try {
    // スプレッドシートとシートを取得
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('フォームの回答 1');
    
    // シートが存在しない場合はエラーログを出力して終了
    if (!sheet) {
      Logger.log('エラー: シート「フォームの回答 1」が見つかりません');
      return;
    }
    
    // 最終行を取得（ヘッダー行を含む）
    const lastRow = sheet.getLastRow();
    
    // データが1行以下（ヘッダーのみ）の場合は処理しない
    if (lastRow <= 1) {
      Logger.log('データが存在しません');
      return;
    }
    
    // 最新行のデータを取得（A列～F列）
    const range = sheet.getRange(lastRow, 1, 1, 6);
    const values = range.getValues()[0];
    
    // 各列のデータを変数に格納
    const timestamp = values[0];      // A列: タイムスタンプ
    const name = values[1];           // B列: 名前
    const email = values[2];          // C列: メールアドレス
    const inquiryType = values[3];    // D列: お問い合わせ種別
    const inquiryContent = values[4]; // E列: お問い合わせ内容
    const status = values[5];         // F列: 対応ステータス
    
    // メールアドレスが空の場合は処理しない
    if (!email) {
      Logger.log('メールアドレスが入力されていません');
      return;
    }
    
    // すでにステータスが設定されている場合は重複送信と判定
    if (status && status !== '') {
      Logger.log('すでに処理済みです（重複送信防止）');
      return;
    }
    
    // メール件名
    const subject = 'お問い合わせを受け付けました';
    
    // お問い合わせ種別に応じて本文を条件分岐
    let bodyMessage = '';
    
    if (inquiryType === '資料請求') {
      bodyMessage = `
${name} 様

この度は資料請求のお問い合わせをいただき、誠にありがとうございます。

ご請求いただいた資料につきましては、2〜3営業日以内に
ご登録のメールアドレス宛に送付させていただきます。

今しばらくお待ちくださいませ。

【お問い合わせ内容】
${inquiryContent}

何かご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。
`;
    } else if (inquiryType === '日程相談') {
      bodyMessage = `
${name} 様

この度は日程相談のお問い合わせをいただき、誠にありがとうございます。

担当者より2営業日以内にご連絡させていただきます。
日程調整の詳細については、改めてご案内申し上げます。

【お問い合わせ内容】
${inquiryContent}

何かご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。
`;
    } else {
      // その他の場合
      bodyMessage = `
${name} 様

この度はお問い合わせいただき、誠にありがとうございます。

お問い合わせ内容を確認させていただき、
担当者より2〜3営業日以内にご連絡させていただきます。

【お問い合わせ内容】
${inquiryContent}

何かご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。
`;
    }
    
    // メール送信
    MailApp.sendEmail(email, subject, bodyMessage);
    
    // F列（対応ステータス）に「未対応」を設定
    sheet.getRange(lastRow, 6).setValue('未対応');
    
    Logger.log('自動返信メールを送信しました: ' + email);
    
  } catch (error) {
    // エラーが発生した場合はログに記録
    Logger.log('エラーが発生しました: ' + error.toString());
  }
}

/**
 * 機能②：対応完了時の自動日時入力
 * 
 * 【動作概要】
 * - セル編集時トリガーで自動実行
 * - F列（対応ステータス）が「完了」に変更された場合のみ動作
 * - G列（対応完了日時）が空欄の場合のみ現在日時を入力
 * - ヘッダー行（1行目）は処理しない
 * - 手動で入力された日時は上書きしない
 * 
 * @param {Object} e - 編集イベントオブジェクト
 */
function onEditTrigger(e) {
  try {
    // イベントオブジェクトが存在しない場合は終了
    if (!e) {
      Logger.log('イベントオブジェクトが存在しません');
      return;
    }
    
    // 編集されたシートを取得
    const sheet = e.source.getActiveSheet();
    
    // シート名が「フォームの回答 1」でない場合は処理しない
    if (sheet.getName() !== 'フォームの回答 1') {
      return;
    }
    
    // 編集されたセルの情報を取得
    const editedRange = e.range;
    const editedRow = editedRange.getRow();
    const editedColumn = editedRange.getColumn();
    
    // ヘッダー行（1行目）は処理しない
    if (editedRow === 1) {
      return;
    }
    
    // F列（6列目）以外の編集は処理しない
    if (editedColumn !== 6) {
      return;
    }
    
    // 編集後の値を取得
    const newValue = editedRange.getValue();
    
    // 「完了」に変更された場合のみ処理
    if (newValue !== '完了') {
      return;
    }
    
    // G列（対応完了日時）のセルを取得
    const completionDateCell = sheet.getRange(editedRow, 7);
    const completionDateValue = completionDateCell.getValue();
    
    // G列が空欄の場合のみ現在日時を入力
    if (!completionDateValue || completionDateValue === '') {
      const now = new Date();
      completionDateCell.setValue(now);
      Logger.log(`対応完了日時を入力しました: ${editedRow}行目 - ${now}`);
    } else {
      Logger.log('対応完了日時はすでに入力されています（上書きしません）');
    }
    
  } catch (error) {
    // エラーが発生した場合はログに記録
    Logger.log('エラーが発生しました: ' + error.toString());
  }
}

/**
 * ========================================
 * 補足説明
 * ========================================
 * 
 * 【列構成】
 * A列: タイムスタンプ
 * B列: 名前
 * C列: メールアドレス
 * D列: お問い合わせ種別（資料請求／日程相談／その他）
 * E列: お問い合わせ内容
 * F列: 対応ステータス（未対応／対応中／完了）
 * G列: 対応完了日時（自動入力）
 * 
 * 【安全性】
 * - try-catchによるエラーハンドリング
 * - 重複送信の防止（F列のステータスで判定）
 * - lastRowは getLastRow() で確実に取得
 * - 空欄・null値のチェック
 * - シート名の厳密なチェック
 * - ヘッダー行の除外
 * 
 * 【保守性】
 * - 変数名は分かりやすく命名
 * - コメントを多めに記載
 * - 処理ごとにログ出力
 * - 定数化できる部分は明示的に記述
 * 
 * ========================================
 */
