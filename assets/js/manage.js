(() => {
  const page = document.querySelector('.manage-page');
  if (!page) return;
  const repository = page.dataset.repository;
  const branch = page.dataset.branch || 'main';
  const list = document.querySelector('#manage-list');
  const editor = document.querySelector('#manage-editor');
  const status = document.querySelector('#manage-status');
  const deleteDialog = document.querySelector('#delete-dialog');
  const tokenDialog = document.querySelector('#manage-token-dialog');
  const tokenInput = document.querySelector('#manage-token-input');
  let current = null;
  let pending = null;
  let token = '';
  let busy = false;

  function message(text, error = false) {
    status.textContent = text;
    status.classList.toggle('is-error', error);
  }

  function endpoint(path) {
    return `https://api.github.com/repos/${repository}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  }

  async function github(path, options = {}) {
    const response = await fetch(`${endpoint(path)}${options.method ? '' : `?ref=${encodeURIComponent(branch)}`}`, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    });
    let data = null;
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      const detail = response.status === 401 ? '令牌无效或已过期。' :
        response.status === 403 ? '令牌没有仓库 Contents 写入权限。' :
        response.status === 404 ? '找不到这篇日记或仓库。请检查 GitHub 仓库是否已发布。' :
        response.status === 409 || response.status === 422 ? '日记已被其他操作修改，请重新打开后再试。' :
        `GitHub 返回 HTTP ${response.status}。`;
      throw new Error(detail);
    }
    return data;
  }

  function decodeBase64(base64) {
    const bytes = Uint8Array.from(atob(base64.replace(/\s/g, '')), c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }

  function scalar(value) {
    const raw = value.trim();
    if (/^["\[]/.test(raw)) {
      try { return JSON.parse(raw); } catch (_) {}
    }
    return raw.replace(/^'(.*)'$/, '$1').replace(/''/g, "'");
  }

  function parsePost(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) throw new Error('日记格式不完整，请在 GitHub 中编辑这篇文件。');
    const lines = match[1].split(/\r?\n/);
    const titleLine = lines.find(line => /^title:\s*/.test(line));
    const tagsLine = lines.find(line => /^tags:\s*/.test(line));
    if (!titleLine || !tagsLine) throw new Error('这篇日记的标题或标签格式暂不支持网页编辑。');
    const title = scalar(titleLine.replace(/^title:\s*/, ''));
    if (typeof title !== 'string' || !title.trim() || /^[>|]$/.test(title)) throw new Error('这篇日记的标题格式暂不支持网页编辑。');
    let tags = [];
    const rawTags = tagsLine.replace(/^tags:\s*/, '').trim();
    if (rawTags.startsWith('[') && rawTags.endsWith(']')) {
      try { tags = JSON.parse(rawTags); }
      catch (_) { tags = rawTags.slice(1, -1).split(',').map(tag => scalar(tag)).filter(Boolean); }
    } else if (!rawTags) {
      const start = lines.indexOf(tagsLine) + 1;
      for (let i = start; i < lines.length && /^\s+-\s+/.test(lines[i]); i++) tags.push(scalar(lines[i].replace(/^\s+-\s+/, '')));
    } else throw new Error('这篇日记的标签格式暂不支持网页编辑。');
    if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) throw new Error('这篇日记的标签格式暂不支持网页编辑。');
    return { lines, body: match[2].trim(), title, tags };
  }

  function updatedPost(parsed, title, tags, body) {
    const lines = [...parsed.lines];
    const titleIndex = lines.findIndex(line => /^title:\s*/.test(line));
    const tagsIndex = lines.findIndex(line => /^tags:\s*/.test(line));
    lines[titleIndex] = `title: ${JSON.stringify(title)}`;
    lines[tagsIndex] = `tags: ${JSON.stringify(tags)}`;
    for (let i = tagsIndex + 1; i < lines.length && /^\s+-\s+/.test(lines[i]);) lines.splice(i, 1);
    return `---\n${lines.join('\n')}\n---\n\n${body.trim()}\n`;
  }

  function validateRepository() {
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('博客尚未配置发布仓库。');
    if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.includes('..')) throw new Error('发布分支配置无效。');
  }

  function setBusy(value) {
    busy = value;
    for (const button of page.querySelectorAll('button')) button.disabled = value;
  }

  function authorize(action) {
    pending = action;
    tokenDialog.showModal();
    tokenInput.focus();
  }

  document.querySelector('#cancel-token').addEventListener('click', () => tokenDialog.close());
  tokenDialog.addEventListener('close', () => { tokenInput.value = ''; pending = null; });
  document.querySelector('#manage-token-form').addEventListener('submit', event => {
    event.preventDefault();
    token = tokenInput.value.trim();
    if (!token) return;
    const action = pending;
    tokenDialog.close();
    action?.();
  });

  list.addEventListener('click', async event => {
    const action = event.target.closest('button[data-action]');
    if (!action || busy) return;
    const item = action.closest('.manage-item');
    const path = item?.dataset.path;
    if (!path || !path.startsWith('_posts/') || !path.endsWith('.md')) return message('日记文件路径无效。', true);
    try {
      validateRepository();
      setBusy(true);
      message('正在读取日记……');
      const file = await github(path);
      if (file.type !== 'file' || !file.sha || file.encoding !== 'base64') throw new Error('无法读取这篇日记的内容。');
      current = { item, path, sha: file.sha, title: item.dataset.title };
      if (action.dataset.action === 'edit') {
        current.parsed = parsePost(decodeBase64(file.content));
        editor.elements.title.value = current.parsed.title;
        editor.elements.tags.value = current.parsed.tags.join(', ');
        editor.elements.body.value = current.parsed.body;
        editor.hidden = false;
        editor.scrollIntoView({ block: 'start', behavior: 'smooth' });
        message('');
      } else {
        document.querySelector('#delete-description').textContent = `删除「${current.title}」？删除后网站更新需要几分钟，文件仍可从 GitHub 历史中恢复。`;
        deleteDialog.showModal();
        message('');
      }
    } catch (error) { message(error.message || '读取失败，请稍后重试。', true); }
    finally { setBusy(false); }
  });

  document.querySelector('#cancel-edit').addEventListener('click', () => { editor.hidden = true; current = null; message(''); });
  document.querySelector('#cancel-delete').addEventListener('click', () => deleteDialog.close());
  document.querySelector('#confirm-delete').addEventListener('click', () => {
    deleteDialog.close();
    if (current) authorize(removePost);
  });

  editor.addEventListener('submit', event => {
    event.preventDefault();
    if (!current || busy) return;
    if (!editor.elements.title.value.trim() || !editor.elements.body.value.trim()) return message('请填好标题和正文。', true);
    authorize(savePost);
  });

  async function savePost() {
    if (!current) return;
    const { path, sha, item, parsed } = current;
    const title = editor.elements.title.value.trim();
    const tags = [...new Set(editor.elements.tags.value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];
    const body = editor.elements.body.value;
    setBusy(true);
    message('正在保存修改……');
    try {
      await github(path, { method: 'PUT', body: { message: `diary: update ${title}`, content: encodeBase64(updatedPost(parsed, title, tags, body)), sha, branch } });
      item.dataset.title = title;
      item.querySelector('a').textContent = title;
      editor.hidden = true;
      current = null;
      message('修改已提交到 GitHub，网站更新后会显示新内容。');
    } catch (error) { message(error.message || '保存失败，请稍后重试。', true); }
    finally { token = ''; setBusy(false); }
  }

  async function removePost() {
    if (!current) return;
    const { path, sha, title, item } = current;
    setBusy(true);
    message('正在删除日记……');
    try {
      await github(path, { method: 'DELETE', body: { message: `diary: delete ${title}`, sha, branch } });
      item.remove();
      editor.hidden = true;
      current = null;
      message('已从 GitHub 删除，网站更新后这篇日记会消失。');
    } catch (error) { message(error.message || '删除失败，请稍后重试。', true); }
    finally { token = ''; setBusy(false); }
  }
})();
