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
        con.execute("""CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            password TEXT NOT NULL,  -- ★ 削除用パスワードカラムを追加
            created_at TEXT NOT NULL
        )""")

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/api/messages")
def get_messages():
    with connect() as con:
        # ★ passwordカラムをSELECTから除外して、外部へ漏洩するのを防ぐ
        rows = con.execute("SELECT id, name, message, created_at FROM messages ORDER BY id DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.post("/api/messages")
def create_message():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()[:30]
    message = str(data.get("message", "")).strip()[:300]
    password = str(data.get("password", "")).strip()  # ★ パスワードを受け取る
    
    if not name or not message or not password:
        return jsonify({"error": "name, message, and password are required"}), 400
        
    created_at = datetime.now(timezone.utc).isoformat()
    with connect() as con:
        cur = con.execute(
            "INSERT INTO messages(name, message, password, created_at) VALUES(?, ?, ?, ?)",
            (name, message, password, created_at)
        )
        row = con.execute("SELECT id, name, message, created_at FROM messages WHERE id=?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201

@app.put("/api/messages/<int:message_id>")
def update_message(message_id):
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()[:300]
    if not message:
        return jsonify({"error": "message is required"}), 400
    with connect() as con:
        cur = con.execute("UPDATE messages SET message=? WHERE id=?", (message, message_id))
        if cur.rowcount == 0:
            return jsonify({"error": "not found"}), 404
    return jsonify({"ok": True})

@app.delete("/api/messages/<int:message_id>")
def delete_message(message_id):
    data = request.get_json(silent=True) or {}
    input_password = str(data.get("password", "")).strip()
    
    if not input_password:
        return jsonify({"error": "password is required"}), 400
        
    with connect() as con:
        # 該当メッセージのパスワードをデータベースから取得
        row = con.execute("SELECT password FROM messages WHERE id=?", (message_id,)).fetchone()
        if not row:
            return jsonify({"error": "not found"}), 404
            
        # サーバ側でパスワードを照合
        if row["password"] != input_password:
            return jsonify({"error": "incorrect password"}), 403
            
        # 一致していれば削除を実行
        con.execute("DELETE FROM messages WHERE id=?", (message_id,))
        
    return "", 204

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)