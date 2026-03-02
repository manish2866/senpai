// ── Conversation state ──
let conversationHistory = [];

// ── Quick replies ──
function addQuickReplies(container) {
    const div = document.createElement('div');
    div.className = 'qr-row';
    div.innerHTML = QUICK_REPLIES.map(q =>
        `<button class="qr-chip ${q.cls}" onclick="quickReply(this,'${q.text.replace(/'/g, "\\'")}')">${q.label}</button>`
    ).join('');
    container.appendChild(div);
}

function quickReply(btn, text) {
    btn.closest('.qr-row').remove();
    document.getElementById('user-input').value = text;
    sendMessage();
}

// ── Send message ──
async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    // Show chat, hide welcome
    document.getElementById('welcome').style.display = 'none';
    const msgs = document.getElementById('messages');
    msgs.style.display = 'flex';

    // Create session if new
    if (!currentSessionId) {
        currentSessionId = await createSession(text);
        conversationHistory = [];
        renderHistory();
    }

    input.value = '';
    input.style.height = 'auto';
    document.getElementById('send-btn').disabled = true;

    appendMessage('user', text, true);
    conversationHistory.push({ role: 'user', content: text });
    const typingEl = appendTyping();

    const selectedModel = document.getElementById('ai-model').value;

    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: conversationHistory.slice(0, -1), model: selectedModel }),
        });

        typingEl.remove();
        const aiEl = appendMessage('ai', '', true);
        const contentEl = aiEl.querySelector('.ai-content');
        let fullText = '';

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of decoder.decode(value).split('\n')) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                    fullText += JSON.parse(data).content || '';
                    contentEl.innerHTML = renderMarkdown(fullText);
                    addCopyButtons(contentEl);
                    Prism.highlightAllUnder(contentEl);
                    msgs.scrollTop = msgs.scrollHeight;
                } catch { }
            }
        }

        addQuickReplies(aiEl.querySelector('.ai-msg-inner'));
        conversationHistory.push({ role: 'assistant', content: fullText });
        sessions[currentSessionId].history = conversationHistory;
        await persistSession(currentSessionId);

    } catch {
        typingEl?.remove();
        appendMessage('ai', '⚠️ Error connecting to SenpAI. Check your GROQ_API_KEY.', true);
    }

    document.getElementById('send-btn').disabled = false;
    msgs.scrollTop = msgs.scrollHeight;
}

// ── Append message to DOM ──
function appendMessage(role, content, animate) {
    const msgs = document.getElementById('messages');
    const wrap = document.createElement('div');
    wrap.className = `message ${role}${animate ? ' msg-in' : ''}`;

    // Avatar
    const av = document.createElement('div');
    av.className = `av ${role === 'user' ? 'av-user' : 'av-ai'}`;
    av.textContent = role === 'user' ? 'M' : 'S';

    if (role === 'user') {
        const bubble = document.createElement('div');
        bubble.className = 'user-msg-inner';
        bubble.textContent = content;
        wrap.appendChild(av);
        wrap.appendChild(bubble);
    } else {
        const inner = document.createElement('div');
        inner.className = 'ai-msg-inner';

        const contentEl = document.createElement('div');
        contentEl.className = 'ai-content';
        if (content) {
            contentEl.innerHTML = renderMarkdown(content);
            addCopyButtons(contentEl);
            Prism.highlightAllUnder(contentEl);
        }

        inner.appendChild(contentEl);
        wrap.appendChild(av);
        wrap.appendChild(inner);
    }

    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
}

// ── Typing indicator ──
function appendTyping() {
    const msgs = document.getElementById('messages');
    const wrap = document.createElement('div');
    wrap.className = 'message ai msg-in';

    const av = document.createElement('div');
    av.className = 'av av-ai';
    av.textContent = 'S';

    const dots = document.createElement('div');
    dots.className = 'typing';
    dots.innerHTML = '<div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div>';

    wrap.appendChild(av);
    wrap.appendChild(dots);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
}
