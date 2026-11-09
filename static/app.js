async function loadMessages() {
     const r = await fetch('/api/messages'); 
     const xs = await r.json(); 
     document.querySelector('#messages').innerHTML = xs.map(x => `<article class="message"><b>${escapeHtml(x.name)}</b><p>${escapeHtml(x.message)}</p><div class="meta">#${x.id}</div></article>`).join('') 
    }
function escapeHtml(s) {
     const d = document.createElement('div'); 
     d.textContent = s; return d.innerHTML 
    }
document.querySelector('#form').addEventListener('submit', async e => {
     e.preventDefault(); 
    const name = document.querySelector('#name').value; 
    const message = document.querySelector('#message').value; 
    const r = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, message }) }); document.querySelector('#status').textContent = r.ok ? '投稿しました' : '投稿に失敗しました'; if (r.ok) { document.querySelector('#message').value = ''; await loadMessages() } }); loadMessages();

    // 要素の取得
const messageInput = document.getElementById('message-input');
const charCount = document.getElementById('char-count');
const charCounter = document.getElementById('char-counter');
const submitButton = document.querySelector('button[type="submit"]');

const MAX_LENGTH = 140;

// 入力イベントのリスナーを追加
messageInput.addEventListener('input', () => {
  const currentLength = messageInput.value.length;
  
  // カウンターの数字を更新
  charCount.textContent = currentLength;
  
  // 文字数制限を超えた場合のスタイリングと制御
  if (currentLength > MAX_LENGTH) {
    charCounter.style.color = 'red';
    submitButton.disabled = true; // 投稿ボタンを無効化
  } else {
    charCounter.style.color = '#666';
    submitButton.disabled = false; // 投稿ボタンを有効化
  }
});