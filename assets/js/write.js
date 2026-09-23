(() => {
  const page = document.querySelector('.writer-page');
  if (!page) return;

  const form = document.querySelector('#diary-form');
  const fields = Object.fromEntries(['date', 'title', 'body', 'tags', 'slug'].map(name => [name, form.elements[name]]));
  const tokenDialog = document.querySelector('#token-dialog');
  const tokenInput = document.querySelector('#token-input');
  let token = '';
  const draftStatus = document.querySelector('#draft-status');
  const publishStatus = document.querySelector('#publish-status');
  const commitLink = document.querySelector('#commit-link');
  const publishButton = document.querySelector('#publish-button');
  const draftKey = 'diary-writer-draft-v1';

  function todayInZone(zone) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = type => parts.find(item => item.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  function suggestedRepository() {
    if (page.dataset.repository) return page.dataset.repository;
    const match = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    if (!match) return '';
    const project = page.dataset.baseurl.split('/').filter(Boolean)[0];
    return `${match[1]}/${project || `${match[1]}.github.io`}`;
  }

  function readDraft() {
    try { return JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch (_) { return null; }
  }

  const draft = readDraft();
  fields.date.value = draft?.date || todayInZone(page.dataset.timezone);
  fields.title.value = draft?.title || '';
  fields.body.value = draft?.body || '';
  fields.tags.value = draft?.tags || '';
  fields.slug.value = draft?.slug || 'diary';
  function saveDraft() {
    try {
      const data = Object.fromEntries(['date', 'title', 'body', 'tags', 'slug'].map(name => [name, fields[name].value]));
      localStorage.setItem(draftKey, JSON.stringify(data));
      draftStatus.textContent = '草稿已保存在当前浏览器。';
    } catch (_) { draftStatus.textContent = '浏览器未允许保存草稿，请先复制正文备用。'; }
  }

  form.addEventListener('input', saveDraft);

  function message(text, error = false) {
    publishStatus.textContent = text;
    publishStatus.classList.toggle('is-error', error);
  }

  document.querySelector('#token-cancel').addEventListener('click', () => tokenDialog.close());
  tokenDialog.addEventListener('close', () => { tokenInput.value = ''; });
  document.querySelector('#token-form').addEventListener('submit', event => {
    event.preventDefault();
    token = tokenInput.value.trim();
    if (!token) return;
    tokenDialog.close();
    form.requestSubmit();
  });

  function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }

  async function github(path, options = {}) {
    const response = await fetch(`https://api.github.com/repos/${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers
      }
    });
    let result = null;
    try { result = await response.json(); } catch (_) {}
    return { response, result };
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    commitLink.hidden = true;
    message('');
    const { date, title, body, tags, slug } = fields;
    const repo = suggestedRepository();
    const filename = slug.value.trim();
    const publishBranch = page.dataset.branch || 'main';
    if (!date.value || !title.value.trim() || !body.value.trim()) return message('请填好日期、标题和正文。', true);
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) return message('博客尚未配置发布仓库。', true);
    if (!/^[A-Za-z0-9._/-]+$/.test(publishBranch) || publishBranch.includes('..') || publishBranch.startsWith('/') || publishBranch.endsWith('/')) return message('发布分支名称无效。', true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.value) || Number.isNaN(Date.parse(`${date.value}T00:00:00Z`))) return message('日期格式无效。', true);
    if (date.value > todayInZone(page.dataset.timezone)) return message('未来日期的日记暂时不会在博客显示，请选择今天或过去的日期。', true);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(filename)) return message('文件名后缀只能用小写英文、数字和中间的短横线。', true);
    const tagList = [...new Set(tags.value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];
    if (tagList.some(tag => /[\r\n]/.test(tag))) return message('标签不能包含换行。', true);
    if (!token) { tokenDialog.showModal(); tokenInput.focus(); return; }

    const file = `_posts/${date.value}-${filename}.md`;
    const content = `---\ntitle: ${JSON.stringify(title.value.trim())}\ndate: ${date.value}\ntags: ${JSON.stringify(tagList)}\n---\n\n${body.value.trim()}\n`;
    const endpoint = `${repo}/contents/${file}`;
    publishButton.disabled = true;
    message('正在检查同名日记……');
    try {
      const check = await github(`${endpoint}?ref=${encodeURIComponent(publishBranch)}`);
      if (check.response.ok) return message('这一天的同名日记已存在。请更换文件名后缀，避免覆盖原文。', true);
      if (check.response.status !== 404) throw new Error(check.response.status === 401 ? '令牌无效或已过期。' : `检查仓库失败（HTTP ${check.response.status}）。`);
      message('正在提交到 GitHub……');
      const saved = await github(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `diary: ${date.value} ${title.value.trim()}`, content: encodeBase64(content), branch: publishBranch })
      });
      if (!saved.response.ok) {
        const detail = saved.response.status === 401 ? '令牌无效或已过期。' :
          saved.response.status === 403 ? '令牌缺少该仓库的 Contents 写入权限，或触发了仓库限制。' :
          saved.response.status === 404 ? '没有找到仓库或分支。请检查仓库名和发布分支。' :
          saved.response.status === 409 || saved.response.status === 422 ? '同名文件可能已存在，或仓库发生冲突。请检查 GitHub 后再重试。' :
          `GitHub 返回 HTTP ${saved.response.status}。`;
        throw new Error(detail);
      }
      try { localStorage.removeItem(draftKey); } catch (_) {}
      draftStatus.textContent = '本机草稿已清除。';
      message('已提交到 GitHub。Pages 构建完成后，这篇日记会出现在首页。');
      const url = saved.result?.commit?.html_url;
      if (typeof url === 'string' && url.startsWith(`https://github.com/${repo}/commit/`)) {
        commitLink.href = url;
        commitLink.hidden = false;
      }
    } catch (error) {
      message(error instanceof TypeError ? '连接 GitHub 失败，请检查网络后重试。草稿仍在本机。' : error.message, true);
    } finally { token = ''; publishButton.disabled = false; }
  });
})();
