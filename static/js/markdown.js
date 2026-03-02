function renderMarkdown(text) {
    marked.setOptions({ breaks: true, gfm: true });
    let html = marked.parse(text);

    // Add code headers with language label + copy button
    html = html.replace(/<pre><code class="language-(\w+)">/g, (_, lang) =>
        `<pre><div class="code-header"><span class="code-lang">${lang}</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div><code class="language-${lang}">`
    );
    html = html.replace(/<pre><code>/g,
        `<pre><div class="code-header"><span class="code-lang">code</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div><code>`
    );

    return html;
}

function addCopyButtons(el) {
    el.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.code-header')) return;
        const h = document.createElement('div');
        h.className = 'code-header';
        h.innerHTML = `<span class="code-lang">code</span><button class="copy-btn" onclick="copyCode(this)">Copy</button>`;
        pre.insertBefore(h, pre.firstChild);
    });
}

function copyCode(btn) {
    const code = btn.closest('pre').querySelector('code');
    navigator.clipboard.writeText(code.innerText).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
