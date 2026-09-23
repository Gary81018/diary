# Gary's Diary

一个可以直接放到 GitHub Pages 的中文日记博客。暖白纸张、衬线标题、日期时间线；支持手机、平板和桌面，以及自动 / 浅色 / 深色三种显示模式。

顶部 **写日记** 页面可以直接写入 GitHub 仓库，**管理** 页面可以修改或删除已发布的日记；提交成功后，GitHub Pages 会自动更新首页、归档和标签。编辑器本身不需要额外服务器。

使用 **Jekyll 3.10 + Markdown + 原生 CSS / JavaScript**。无需 Node.js、数据库、付费服务或自定义 Jekyll 插件；不加载外部字体、分析脚本或 CDN。示例内容均带有“示例”标识，不代表作者真实经历。

## 1. 发布到 GitHub Pages（无需在 Mac 安装 Ruby）

1. 在 GitHub 新建仓库，例如 `diary`。使用 GitHub Free 时选择 Public。此博客用于可公开的记录，Pages 网页不是私人日记空间。
2. 将本项目**目录里的文件**上传到仓库根目录：根目录应直接看到 `_config.yml`、`index.html`、`_posts/`，不要再套一层 `diary/`。不要上传 `_site/`、`vendor/`、`.bundle/`。
3. 编辑 `_config.yml`，填入用户名和仓库路径：

   ```yaml
   title: "Gary's Diary"
   author: "Gary"
   url: "https://YOUR_USERNAME.github.io"
   baseurl: "/diary"
   ```

   | 网站类型 | 仓库名 | `baseurl` |
   | --- | --- | --- |
   | 项目博客 | `diary` | `"/diary"` |
   | 用户主页 | `YOUR_USERNAME.github.io` | `""` |
   | 其他项目名 | 如 `journal` | `"/journal"` |

   `url` 不带仓库路径和结尾斜杠，`baseurl` 不带结尾斜杠。示例中的 `YOUR_USERNAME` 要替换为自己的 GitHub 用户名。
   普通 `用户名.github.io` 地址会自动识别仓库；使用自定义域名时，再设置 `github_repository: "用户名/仓库名"`。如果 Pages 发布分支不是 `main`，把 `github_branch` 改为实际分支。
4. 打开仓库 **Settings → Pages → Build and deployment**：
   - Source：**Deploy from a branch**。
   - Branch：**main**，文件夹：**/ (root)**，点击 Save。
   - 本项目使用 GitHub 原生 Jekyll 构建，**不要添加 `.nojekyll`**。
5. 打开仓库 **Actions** 查看 `pages build and deployment`，等待它成功，再打开 Pages 设置页提供的网站地址。项目博客通常为 `https://YOUR_USERNAME.github.io/diary/`。

如果页面没有更新，先看 Actions 的构建日志；不要仅凭推送成功判断上线成功。不要同时选择 GitHub Actions 作为 Pages Source，本模板没有自定义部署工作流。

### 用终端推送

在项目目录执行（新建空仓库时，不要勾选自动添加 README）：

```bash
git init -b main
git add .
git commit -m "Create diary blog"
git remote add origin https://github.com/YOUR_USERNAME/diary.git
git push -u origin main
```

若远端已经有文件，先 clone 仓库，再将项目文件复制进去提交，不要强制覆盖远端。

## 2. 在网页上直接写日记

先按上面的步骤发布项目。打开博客顶部的 **写日记**，填写日期、标题、正文、标签，点击 **提交日记**。同一天写第二篇时，更改「文件名后缀」，避免覆盖已有文章。写到一半关闭页面，草稿会保存在当前浏览器；GitHub 令牌不会随草稿保存。

首次发布前，在 [GitHub 创建 fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)：

1. **Repository access** 选 **Only select repositories**，仅选择这个日记仓库。
2. **Repository permissions → Contents** 设为 **Read and write**；其余保持默认。设置有效期，并安全保存 GitHub 只显示一次的令牌。
3. 点击 **提交日记** 时，页面会弹出令牌输入框。每次重新打开网页需要再输入；页面不会将它写入站点文件、草稿或浏览器存储。仓库和发布分支从 `_config.yml` 读取，不出现在写作表单中。

点击发布后，页面会显示 GitHub 提交结果。**提交成功不等于网页已完成更新**：到仓库 Actions 查看 Pages 构建，通常要等几分钟。博客是公开站点，请不要写入私人内容。令牌有仓库写入权限，不要将它写进正文或截图分享。

如果网页显示「仓库或分支不存在」，检查 `_config.yml` 中的 `github_repository` 和 `github_branch`。若提示权限不足，检查令牌是否仍有效且授权了正确仓库的 Contents 写入权限。该页面只新建日记，不会覆盖同名文章；修改或删除已发布日记请用顶部的 **管理** 页面。

### 修改或删除已有日记

打开博客顶部的 **管理**，找到文章后点击 **修改** 或 **删除**。修改时可以编辑标题、标签和正文；日期与文章网址保持不变。删除前会再次确认。提交时输入同一个仅授权日记仓库的令牌，页面不会保存它。操作成功后，GitHub Pages 需要几分钟重新生成页面；删除的文件仍可从 GitHub 提交历史恢复。

管理页列出网站当前已发布的文章。若新文章还未出现，等待 Pages 更新并刷新页面。若同时在 Mac 上编辑这个仓库，先 `git pull` 获取网页上的修改，再提交本地改动，避免覆盖新版本。其他 Front Matter 字段会保留；非常规格式的文章可直接在 GitHub 的 `_posts/` 中修改。

GitHub Pages 是静态托管，不能自行处理登录和写入；此页面通过 [GitHub 官方 Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents) 保存 Markdown。API 支持[浏览器跨域请求](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests)。如果以后希望像普通博客后台那样免输令牌，需要增加带登录的独立服务。

## 3. 在 Mac 本地预览

只在网页写日记不需要安装任何东西。本地预览建议使用独立 Ruby，避免改动 macOS 自带 Ruby。

已安装 Homebrew 的 Mac：

```bash
brew install ruby@3.3
export PATH="$(brew --prefix ruby@3.3)/bin:$PATH"
gem install bundler
```

在项目目录中：

```bash
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve --baseurl=""
```

浏览器打开 <http://127.0.0.1:4000/>。终端保持运行，按 Control+C 停止。每个新终端都需设置上面的 PATH，或按 Homebrew 的提示加入自己的 shell 配置。

测试真实仓库子路径时运行 `bundle exec jekyll serve`，打开 <http://127.0.0.1:4000/diary/>。修改 `_config.yml` 后需要重启预览。

Gemfile 使用与 GitHub Pages 相同的 Jekyll 3.10 系列；交付附带的 Gemfile.lock 固定了本次验证的依赖。原生 Pages 构建仍使用 GitHub 管理的依赖版本。

## 4. 用终端写一篇新日记

在项目目录执行（脚本使用 Mac 自带的 Ruby 标准库，不依赖 bundle install）：

```bash
bash new-diary.sh "今天的一点想法"
```

默认按新加坡时区生成 `_posts/YYYY-MM-DD-diary.md`。同一天的第二篇可另起文件名：

```bash
bash new-diary.sh "散步时想到的事" --slug evening --tags 生活,随想
bash new-diary.sh "回顾那一天" --date 2026-09-20 --slug looking-back
bash new-diary.sh "还没写好的日记" --slug draft --draft
```

脚本不会覆盖已有文件，标题中的引号、冒号等会自动转义。可从任意目录调用脚本；日记始终创建到脚本旁边的 `_posts/`。若更改网站时区，也请同步设置脚本的 `TZ`（例如 `TZ=Asia/Shanghai bash new-diary.sh`）。

打开新文件，修改正文和标签：

```markdown
---
title: "今天的一点想法"
date: 2026-09-24 00:00:00 +0800
tags: [生活, 随想]
---

今天值得记住的是……

## 今天做了什么

- 散了一会儿步。

## 留给明天

再写一点。
```

写完后提交：

```bash
git add _posts assets/images
git commit -m "diary: update journal"
git push
```

首页、归档和标签会自动更新。文章链接由日期和文件名后缀决定；发布后尽量不要更改这些字段，以免旧链接失效。

**草稿：** `--draft` 生成 `published: false`，网站默认不显示。写好后改为 `published: true`。本地检查草稿用 `bundle exec jekyll serve --baseurl="" --unpublished`。未来日期默认不发布，可用 `--future` 在本地预览；到日期后需重新构建/推送才能上线，不提供定时发布。

**公开边界：** `published: false` 仅控制网页显示，公开仓库中的源文件和历史仍可被读取；私密内容不要提交到这个仓库。

## 5. 放照片与修改外观

照片放入 `assets/images/`，推荐英文小写文件名。在日记中插入：

```liquid
![这张照片的简短描述]({{ '/assets/images/my-photo.jpg' | relative_url }})
```

`relative_url` 让图片在用户主页和 `/diary/` 子路径都可用。项目附带原创 SVG 示例插画 `quiet-window.svg`，可删除或替换。

- `_config.yml`：站点名称、作者、描述、时区、发布地址。
- `about.md`：个人介绍模板，发布前改成自己的文字。
- `_posts/`：三篇示例日记，可全部删除；删除后首页会显示空状态。
- `css/style.css`：颜色、间距、中文字体；颜色变量集中在文件开头。
- `assets/favicon.svg`、`_layouts/default.html` 中的 `brand-mark`：默认 `g.` 小标记，可改成自己的首字母。
- `index.html`：首页欢迎语和侧栏文字。
- `write.html` 与 `assets/js/write.js`：网页写日记页面和提交逻辑。
- `manage.html` 与 `assets/js/manage.js`：已发布日记的修改、删除页面。

深色模式默认跟随系统，右上角按“自动 → 浅色 → 深色”循环，手动选择保存在当前浏览器。即使 JavaScript 被禁用，页面和所有导航仍可使用，并继续通过 CSS 跟随系统主题。

## 6. 项目结构

```text
diary/
├── _posts/                 # Markdown 日记
├── _layouts/               # 通用页面与文章模板
├── _includes/entry.html    # 时间线条目
├── assets/
│   ├── images/             # 图片
│   ├── js/theme.js         # 主题切换
│   ├── js/write.js         # 网页日记编辑器
│   ├── js/manage.js        # 日记管理操作
│   └── favicon.svg
├── css/style.css
├── index.html              # 首页时间线
├── archive.html            # 按年月归档
├── tags.html               # 标签索引
├── about.md
├── write.html              # 网页写日记
├── manage.html             # 网页管理日记
├── 404.html
├── _config.yml
├── Gemfile / Gemfile.lock
├── new-diary.sh
├── scripts/check.sh        # 日记脚本检查 + Jekyll 构建
└── README.md
```

## 7. 验证与排错

安装依赖后运行：

```bash
bash scripts/check.sh
```

检查在临时目录内测试新建日记、特殊字符、日期和防覆盖，然后构建网站，不会改动日记。首次启动若遇到依赖错误，先检查 `ruby -v` 和 `bundle install` 是否成功。

- **样式/图片消失：** 检查 `baseurl` 是否与仓库名一致。
- **文章没显示：** 检查文件名日期、Front Matter、`published` 和未来日期。
- **Pages 404：** 检查分支、根目录、Actions 是否成功，并使用 Pages 设置页给出的准确 URL。
- **中文字体不同：** 使用本机系统字体，macOS 与 Windows 字形略有区别，不需要联网下载字体。

官方资料（2026-09-24 核对）：[Pages 发布源设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[Pages 依赖版本](https://pages.github.com/versions/)、[Jekyll 本地预览](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll)。
