// ── Session state ──
let sessions = {};
let currentSessionId = null;

async function loadSessions() {
    try {
        const res = await fetch('/sessions');
        sessions = await res.json();
    } catch {
        sessions = {};
    }
}

async function createSession(firstMessage) {
    const id = Date.now().toString();
    const session = {
        id,
        title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '…' : ''),
        history: [],
        createdAt: Date.now(),
    };
    sessions[id] = session;
    await persistSession(id);
    return id;
}

async function persistSession(id) {
    if (!sessions[id]) return;

    // Save to SQLite only
    try {
        await fetch(`/sessions/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessions[id]),
        });
    } catch (e) { }
}

async function deleteSession(e, id) {
    e.stopPropagation();
    delete sessions[id];

    // Delete from SQLite only
    try { await fetch(`/sessions/${id}`, { method: 'DELETE' }); } catch (e) { }

    if (currentSessionId === id) newChat();
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const sorted = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);

    if (!sorted.length) {
        list.innerHTML = '<p class="text-xs px-3 py-2" style="color:rgba(255,255,255,0.22)">No chats yet</p>';
        return;
    }

    list.innerHTML = sorted.map(s => `
    <div class="hist-item ${s.id === currentSessionId ? 'active' : ''}" id="hist-${s.id}" onclick="loadSession('${s.id}')">
      <div class="hist-thumb">💬</div>
      <span class="hist-label">${escapeHtml(s.title)}</span>
      <div class="hist-actions">
        <button class="hist-btn" onclick="renameSession(event,'${s.id}')" title="Rename">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
        </button>
        <button class="hist-btn danger" onclick="deleteSession(event,'${s.id}')" title="Delete">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

async function renameSession(e, id) {
    e.stopPropagation();
    if (!sessions[id]) return;

    const newTitle = prompt("Rename chat:", sessions[id].title);
    if (newTitle !== null && newTitle.trim() !== "") {
        sessions[id].title = newTitle.trim();
        await persistSession(id);
        renderHistory();
    }
}

function loadSession(id) {
    const session = sessions[id];
    if (!session) return;

    currentSessionId = id;
    conversationHistory = [...session.history];

    const msgs = document.getElementById('messages');
    msgs.innerHTML = '';
    msgs.classList.remove('hidden');
    msgs.classList.add('flex');
    document.getElementById('welcome').style.display = 'none';

    session.history.forEach(m => appendMessage(m.role === 'user' ? 'user' : 'ai', m.content, false));
    renderHistory();
    msgs.scrollTop = msgs.scrollHeight;

    // Close sidebar on mobile after selecting a chat
    closeSidebar();
}
