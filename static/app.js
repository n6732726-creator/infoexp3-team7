
const messageInput = document.getElementById('message');
const charCount = document.getElementById('char-count');
const submitButton = document.querySelector('#form button');

const MAX_LENGTH = 300;

// 文字数カウント
if (messageInput && charCount) {
  messageInput.addEventListener('input', () => {
    const currentLength = messageInput.value.length;
    charCount.textContent = currentLength;

    if (submitButton) {
      submitButton.disabled = currentLength > MAX_LENGTH;
    }
  });
}

// HTMLエスケープ
function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// 投稿一覧を読み込む
async function loadMessages() {
  const r = await fetch('/api/messages');
  const xs = await r.json();

  document.querySelector('#messages').innerHTML = xs.map(x => `
    <article class="message">
      <b class="message-name">${escapeHtml(x.name)}</b>
      <p class="message-text">${escapeHtml(x.message)}</p>

      <div class="reactions">
        ${['👍', '❤️', '😂', '🔥'].map(reaction => `
          <button class="reaction-btn"
            onclick="addReaction(${x.id}, '${reaction}')">
            ${reaction}
            <span id="reaction-${x.id}-${reaction}">0</span>
          </button>
        `).join('')}
      </div>

      <div class="meta">#${x.id}</div>

      <button class="rainbow-toggle" type="button" aria-pressed="false">
        🌈 虹色に光らせる
      </button>

      <div class="replies" id="replies-${x.id}"></div>

      <form class="reply-form" onsubmit="submitReply(event, ${x.id})">
        <input type="text" id="reply-name-${x.id}"
          placeholder="名前" maxlength="30" required>
        <input type="text" id="reply-message-${x.id}"
          placeholder="返信を入力..." maxlength="300" required>
        <button type="submit">返信</button>
      </form>
    </article>
  `).join('');

  for (const x of xs) {
    await loadReactions(x.id);
    await loadReplies(x.id);
  }
}

// 虹色発光機能
document.querySelector('#messages').addEventListener('click', e => {
  const button = e.target.closest('.rainbow-toggle');
  if (!button) return;

  const message = button.closest('.message');
  const isGlowing = message.classList.toggle('is-rainbow');

  button.setAttribute('aria-pressed', String(isGlowing));
  button.textContent = isGlowing
    ? '✨ 光らせ中'
    : '🌈 虹色に光らせる';
});

// リアクション数を読み込む
async function loadReactions(messageId) {
  const r = await fetch(`/api/messages/${messageId}/reactions`);
  const data = await r.json();

  ['👍', '❤️', '😂', '🔥'].forEach(reaction => {
    const count = data[reaction] || 0;
    const element = document.getElementById(
      `reaction-${messageId}-${reaction}`
    );

    if (element) element.textContent = count;
  });
}

// リアクションを追加
async function addReaction(messageId, reaction) {
  const r = await fetch(`/api/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reaction })
  });

  if (r.ok) {
    await loadReactions(messageId);
  }
}

// 返信一覧を読み込む
async function loadReplies(messageId) {
  const r = await fetch(`/api/messages/${messageId}/replies`);
  const replies = await r.json();

  const area = document.getElementById(`replies-${messageId}`);
  if (!area) return;

  area.innerHTML = replies.map(reply => `
    <div class="reply">
      <b>${escapeHtml(reply.name)}</b>
      <p>${escapeHtml(reply.message)}</p>
    </div>
  `).join('');
}

// 返信を投稿
async function submitReply(event, messageId) {
  event.preventDefault();

  const nameInput = document.getElementById(`reply-name-${messageId}`);
  const messageInput = document.getElementById(`reply-message-${messageId}`);

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  if (!name || !message) return;

  const r = await fetch(`/api/messages/${messageId}/replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, message })
  });

  if (r.ok) {
    messageInput.value = '';
    await loadReplies(messageId);
  } else {
    alert('返信に失敗しました');
  }
}

// 新規投稿
document.querySelector('#form').addEventListener('submit', async e => {
  e.preventDefault();

  const name = document.querySelector('#name').value;
  const message = document.querySelector('#message').value;

  const r = await fetch('/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, message })
  });

  document.querySelector('#status').textContent =
    r.ok ? '投稿しました' : '投稿に失敗しました';

  if (r.ok) {
    document.querySelector('#message').value = '';

    if (charCount) charCount.textContent = '0';

    await loadMessages();
  }
});

// 初期読み込み
loadMessages();
