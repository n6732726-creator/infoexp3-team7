from flask import Flask, jsonify, render_template, request
from pathlib import Path
import sqlite3
from datetime import datetime, timezone

app = Flask(__name__)
DB = Path("data/miniboard.db")

def connect():
    DB.parent.mkdir(exist_ok=True)
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    with connect() as con:
        # 投稿テーブル
        con.execute("""CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")

        # リアクションテーブル
        con.execute("""CREATE TABLE IF NOT EXISTS reactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            reaction TEXT NOT NULL,
            FOREIGN KEY(message_id) REFERENCES messages(id)
        )""")

                # 返信テーブル
        con.execute("""CREATE TABLE IF NOT EXISTS replies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(message_id) REFERENCES messages(id)
        )""")

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/api/messages")
def get_messages():
    with connect() as con:
        rows = con.execute("SELECT * FROM messages ORDER BY id DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.post("/api/messages")
def create_message():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()[:30]
    message = str(data.get("message", "")).strip()[:300]
    if not name or not message:
        return jsonify({"error": "name and message are required"}), 400
    created_at = datetime.now(timezone.utc).isoformat()
    with connect() as con:
        cur = con.execute("INSERT INTO messages(name,message,created_at) VALUES(?,?,?)", (name,message,created_at))
        row = con.execute("SELECT * FROM messages WHERE id=?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201

@app.put("/api/messages/<int:message_id>")
def update_message(message_id):
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()[:300]
    if not message:
        return jsonify({"error": "message is required"}), 400
    with connect() as con:
        cur = con.execute("UPDATE messages SET message=? WHERE id=?", (message,message_id))
        if cur.rowcount == 0:
            return jsonify({"error": "not found"}), 404
    return jsonify({"ok": True})

@app.delete("/api/messages/<int:message_id>")
def delete_message(message_id):
    with connect() as con:
        cur = con.execute("DELETE FROM messages WHERE id=?", (message_id,))
        if cur.rowcount == 0:
            return jsonify({"error": "not found"}), 404
    return "", 204

@app.post("/api/messages/<int:message_id>/reactions")
def add_reaction(message_id):
    data = request.get_json(silent=True) or {}
    reaction = str(data.get("reaction", ""))

    allowed = ["👍", "❤️", "😂", "🔥"]

    if reaction not in allowed:
        return jsonify({"error": "invalid reaction"}), 400

    with connect() as con:
        # 投稿が存在するか確認
        message = con.execute(
            "SELECT id FROM messages WHERE id=?",
            (message_id,)
        ).fetchone()

        if message is None:
            return jsonify({"error": "not found"}), 404

        # リアクションを登録
        con.execute(
            "INSERT INTO reactions(message_id, reaction) VALUES(?,?)",
            (message_id, reaction)
        )

        # リアクション数を取得
        rows = con.execute(
            "SELECT reaction, COUNT(*) AS count FROM reactions "
            "WHERE message_id=? GROUP BY reaction",
            (message_id,)
        ).fetchall()

    return jsonify({r["reaction"]: r["count"] for r in rows})

@app.get("/api/messages/<int:message_id>/reactions")
def get_reactions(message_id):
    with connect() as con:
        rows = con.execute(
            "SELECT reaction, COUNT(*) AS count FROM reactions "
            "WHERE message_id=? GROUP BY reaction",
            (message_id,)
        ).fetchall()

    return jsonify({r["reaction"]: r["count"] for r in rows})

# 返信一覧を取得
@app.get("/api/messages/<int:message_id>/replies")
def get_replies(message_id):
    with connect() as con:
        rows = con.execute(
            "SELECT * FROM replies WHERE message_id=? ORDER BY id ASC",
            (message_id,)
        ).fetchall()

    return jsonify([dict(r) for r in rows])


# 返信を投稿
@app.post("/api/messages/<int:message_id>/replies")
def create_reply(message_id):
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()[:30]
    message = str(data.get("message", "")).strip()[:300]

    if not name or not message:
        return jsonify({"error": "name and message are required"}), 400

    created_at = datetime.now(timezone.utc).isoformat()

    with connect() as con:
        # 元の投稿が存在するか確認
        post = con.execute(
            "SELECT id FROM messages WHERE id=?",
            (message_id,)
        ).fetchone()

        if post is None:
            return jsonify({"error": "not found"}), 404

        cur = con.execute(
            """INSERT INTO replies
            (message_id, name, message, created_at)
            VALUES (?, ?, ?, ?)""",
            (message_id, name, message, created_at)
        )

        row = con.execute(
            "SELECT * FROM replies WHERE id=?",
            (cur.lastrowid,)
        ).fetchone()

    return jsonify(dict(row)), 201

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)
