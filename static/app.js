const messageInput = document.getElementById('message'); // HTML側は id="message"
const charCount = document.getElementById('char-count');
const submitButton = document.querySelector('form button'); // フォーム内のボタンを取得

const MAX_LENGTH = 300; // HTMLの maxlength="300" に合わせる

// 入力イベント（文字数カウント ＆ ボタン制御）
if (messageInput && charCount) {
  messageInput.addEventListener('input', () => {
    const currentLength = messageInput.value.length;
    
    // 数字を更新
    charCount.textContent = currentLength;
    
    // 300文字を超えた場合の制御
    if (currentLength > MAX_LENGTH) {
      if (submitButton) submitButton.disabled = true;
    } else {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function loadMessages() {
  const r = await fetch('/api/messages'); 
  const xs = await r.json(); 
  
  // 各メッセージカードに「削除」ボタンを追加
  document.querySelector('#messages').innerHTML = xs.map(x => `
    <article class="message">
      <b>${escapeHtml(x.name)}</b>
      <p>${escapeHtml(x.message)}</p>
      <div class="meta">#${x.id} - ${x.created_at || ''}</div>
      <button type="button" onclick="deleteMessage(${x.id})">削除</button>
    </article>
  `).join('');
}

function escapeHtml(s) {
  const d = document.createElement('div'); 
  d.textContent = s; 
  return d.innerHTML;
}

// 投稿時の処理（パスワードも含めて送信する）
document.querySelector('#form').addEventListener('submit', async e => {
  e.preventDefault(); 
  const name = document.querySelector('#name').value; 
  const message = document.querySelector('#message').value; 
  const password = document.querySelector('#password').value; // ★ パスワードの値を取得
  
  const r = await fetch('/api/messages', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ name, message, password }) // ★ passwordを含めて送信
  }); 
  
  document.querySelector('#status').textContent = r.ok ? '投稿しました' : '投稿に失敗しました'; 
  
  if (r.ok) { 
    document.querySelector('#message').value = ''; 
    document.querySelector('#password').value = ''; // ★ 投稿成功後にパスワード入力欄もクリア
    // 投稿成功したら文字数カウンターも 0 にリセットする
    if (charCount) charCount.textContent = '0';
    await loadMessages(); 
  }
});

// ★ 削除ボタンが押されたときの処理（パスワード入力を求める）
async function deleteMessage(id) {
  const password = prompt("この投稿を削除するためのパスワードを入力してください：");
  if (!password) return; // キャンセルされたら何もしない

  try {
    const r = await fetch(`/api/messages/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password }) // 入力されたパスワードを送信
    });

    if (r.ok) {
      alert("削除しました");
      await loadMessages(); // 一覧を再読み込み
    } else {
      const err = await r.json();
      alert("削除失敗: " + (err.error || "パスワードが間違っています"));
    }
  } catch (e) {
    console.error("Error:", e);
    alert("通信エラーが発生しました");
  }
}

// 初期読み込み
loadMessages();