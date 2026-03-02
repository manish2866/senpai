// ── App init + UI orchestration ──

function saveModelChoice() {
    const val = document.getElementById('ai-model').value;
    localStorage.setItem('senpai_model', val);
}

function renderStarters() {
    document.getElementById('starter-grid').innerHTML = STARTERS.map(c => `
    <div class="starter-card" onclick="useStarter('${c.text.replace(/'/g, "\\'")}')">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-base">${c.emoji}</span>
        <span class="text-[11px] font-medium uppercase tracking-wide" style="color:#a78bfa">${c.label}</span>
      </div>
      <p class="text-sm leading-snug" style="color:rgba(255,255,255,0.55)">${c.text}</p>
    </div>
  `).join('');
}

function useStarter(text) {
    document.getElementById('user-input').value = text;
    sendMessage();
}

function newChat() {
    currentSessionId = null;
    conversationHistory = [];
    document.getElementById('messages').innerHTML = '';
    document.getElementById('messages').classList.add('hidden');
    document.getElementById('messages').classList.remove('flex');
    document.getElementById('welcome').style.display = '';
    renderHistory();
    closeSidebar();
}

// ── Mobile sidebar toggle ──
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

// ── Keyboard setup ──
document.getElementById('user-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

document.getElementById('user-input').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 176) + 'px';
});

// ── Bootstrap ──
async function init() {
    // Load saved model choice
    const storedModel = localStorage.getItem('senpai_model');
    if (storedModel) {
        document.getElementById('ai-model').value = storedModel;
    }

    await loadSessions();
    renderHistory();
    renderStarters();
}

init();
