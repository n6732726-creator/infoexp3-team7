
// 投稿一覧を取得・表示
async function loadMessages() {
    const r = await fetch('/api/messages');
    const xs = await r.json();

    document.querySelector('#messages').innerHTML = xs.map(x => {
        // UTCの投稿日時を日本時間に変換
        const date = x.created_at
            ? new Date(x.created_at).toLocaleString('ja-JP', {
                timeZone: 'Asia/Tokyo'
            })
            : '日時不明';

        return `
            <article class="message">
                <b>${escapeHtml(x.name)}</b>
                <p>${escapeHtml(x.message)}</p>
                <div class="meta">
                    #${x.id} | 投稿日時：${date}
                </div>
            </article>
        `;
    }).join('');
}

// HTMLとして解釈されないようにする
function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// 投稿処理
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
        await loadMessages();
    }
});

// ページ読み込み時に投稿一覧を表示
loadMessages();
