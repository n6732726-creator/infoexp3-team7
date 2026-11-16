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
    
    // 300文字を超えた場合の制御（必要に応じて）
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
  document.querySelector('#messages').innerHTML = xs.map(x => `
    <article class="message">
      <b class="message-name">${escapeHtml(x.name)}</b>
      <p class="message-text">${escapeHtml(x.message)}</p>
      <div class="meta">#${x.id}</div>
      <button class="rainbow-toggle" type="button" aria-pressed="false">🌈 虹色に光らせる</button>
    </article>
  `).join('');
}

function escapeHtml(s) {
  const d = document.createElement('div'); 
  d.textContent = s; 
  return d.innerHTML;
}

document.querySelector('#messages').addEventListener('click', e => {
  const button = e.target.closest('.rainbow-toggle');
  if (!button) return;

  const message = button.closest('.message');
  const isGlowing = message.classList.toggle('is-rainbow');
  button.setAttribute('aria-pressed', String(isGlowing));
  button.textContent = isGlowing ? '✨ 光らせ中' : '🌈 虹色に光らせる';
});

document.querySelector('#form').addEventListener('submit', async e => {
  e.preventDefault(); 
  const name = document.querySelector('#name').value; 
  const message = document.querySelector('#message').value; 
  
  const r = await fetch('/api/messages', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ name, message }) 
  }); 
  
  document.querySelector('#status').textContent = r.ok ? '投稿しました' : '投稿に失敗しました'; 
  
  if (r.ok) { 
    document.querySelector('#message').value = ''; 
    // 投稿成功したら文字数カウンターも 0 にリセットする
    if (charCount) charCount.textContent = '0';
    await loadMessages(); 
  }
});

// 初期読み込み
loadMessages();