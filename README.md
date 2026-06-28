# ⚡ Ecommerce Growth Agent — 全自动电商增长 AI 助手

`Ecommerce Growth Agent` (原名 `Skill Runner`) 是一款基于大模型的网页端全自动电商增长与运营辅助 Chrome 插件。

它能直接在当前浏览器网页（如淘宝、Etsy、亚马逊、Temu 等）读取 DOM 结构、捕获页面截图，并根据用户指派的**专家技能 (Skill)** 自主规划并执行多步动作（如：分析趋势、跨页面对比竞品、深挖差评痛点、自动生成 Listing 等），并最终输出结构化的中文商业分析报告。

**所有数据流本地直连大模型 API，无第三方中间服务器，彻底保护商业数据隐私。**

---

## 🏗️ 插件架构

本插件采用 Manifest V3 标准构建，后台 Service Worker 采用模块化的 ES Modules 规范，架构设计如下：

```
ecommerce-growth-agent/
├── manifest.json              # MV3 配置文件 (声明 background 类型为 module)
├── background.js              # 后台 Service Worker 入口 (处理 Port 长连接与消息分发)
├── content.js                 # 页面上下文注入读取器 (DOM 提取、自动清理弹窗、模拟点击)
├── sidepanel.html/css/js      # 侧边栏 UI 与控制器 (支持 HTML 净化防御 XSS)
├── libs/                      # 第三方依赖库 (已瘦身，仅保留 marked.min.js)
├── modules/                   # 模块化后台业务逻辑
│   ├── llmClient.js           # 大模型 API 调用 (支持指数退避重试、SSE 流式解析)
│   ├── toolRegistry.js        # 自动化工具箱注册 (含系统页面脚本注入安全校验)
│   └── agentLoop.js           # Agent 自主思考-动作-反思状态机循环
└── skills/                    # 专家 Skill 提示词目录 (可根据业务场景自定义)
    ├── taobao_homepage_explorer.skill.md
    ├── etsy_crossborder_explorer.skill.md
    ├── ecommerce_page_analyzer.skill.md
    ├── global_shop_optimizer.skill.md
    ├── amazon_listing_generator.skill.md
    ├── etsy_keyword_analysis.skill.md
    ├── competitor_review_analysis.skill.md
    └── product_opportunity_scorer.skill.md
```

---

## 🚀 核心升级与安全机制 (Industrial-Grade Features)

### 1. 🔒 强力 XSS 注入防护 (XSS Sanitization)
前端渲染采用基于浏览器原生的 `DOMParser` 进行 HTML 消毒处理。即便大模型从网页上抓取到恶意的 `<script>` 标签或被注入 `javascript:` 链接，页面在通过 `innerHTML` 渲染时也会自动将其过滤剥离，确保本地 API Key 绝对安全。

### 🔑 2. API Key 安全脱敏
在侧边栏进度日志及报错提示中，系统内置了对敏感 Token（如 `Bearer sk-...`）的正则过滤规则，防止开发者和用户在分享日志或截图时无意泄露密钥。

### 🔄 3. Port 长连接双向通信
废弃了原先依赖高频写入 Storage 的轮询同步方案，改用 `chrome.runtime.connect` 长链接。Sidepanel 与后台 Service Worker 实时回传流式 Token（包含 Reasoning 推理步骤），网络吞吐更高，并在用户手动取消时能瞬间断开连接并中止后台 Agent 循环。

### 🛡️ 4. 脚本注入安全限制
在脚本注入（`executeScript`）之前自动对 Tab 网页进行安全策略检测。如果试图在 `chrome://` 或 Chrome 扩展商店等特权系统页面上运行，系统将友好拦截并提示用户，避免引发未捕获的运行时异常。

### 📶 5. 指数退避 API 重试
调用外部大模型 API 时，如果遭遇短期网络波动或 `HTTP 429` 频率限制，系统会自动启动简易的指数退避重试逻辑（最长重试 3 次，等待间隔 1s, 2s, 4s），大幅提升长任务的成功率。

---

## 📦 安装与配置

1. 下载或 Clone 本仓库代码：`git clone https://github.com/your-repo/ecommerce-growth-agent.git`
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角「**开发者模式**」
4. 点击「**加载已解压的扩展程序**」，选择 `ecommerce-growth-agent` 文件夹
5. 在侧边栏的“设置 (⚙️)”中配置你习惯的 LLM Provider（如 OpenAI, Anthropic, Qwen, SiliconFlow, Groq 等）及 API Key 即可开始使用。

---

## 🛠️ 内置工具箱 (Agent Tools)

Agent 在执行任务时，可以自由组合并调用以下底层的浏览器自动化工具：

| 工具名称 | 参数 | 说明 |
|----------|------|------|
| `read_current_page` | 无 | 抓取当前活动页面的标题、价格、评分、部分可视正文及核心图片 |
| `extract_product_info` | 无 | 将页面 DOM 数据进行初筛，格式化为标准商品对象 |
| `get_selected_text` | 无 | 读取用户在当前网页上手动框选的文本内容 |
| `click_by_text` | `text` (字符串) | 在页面中寻找匹配该文本的按钮/链接并执行点击 (如翻页或销量排序) |
| `search_web` | `query` (词), `engine` | 翻译并搜索 Google, Bing, 淘宝, Etsy, Amazon 并自动跳转加载 |
| `navigate_to` | `url` (链接) | 驱动 Tab 直接跳转到目标网页并等待渲染完成 |
| `save_result` | `args` | 将 Agent 报告保存至本地“结果库”中 |
| `get_saved_results` | `limit` | 读取本地历史保存的分析记录 |

---

## 📂 自定义新增 Skill

每一个 `skill.md` 都是大模型扮演特定运营专家时的 System Prompt。

1. 在 `skills/` 目录下创建一个包含 Markdown 提示词的文件（例如 `my_expert.skill.md`）。
2. 在文件头部或规则中，定义你对大模型的执行步骤约束（Funnel）。
3. 声明输出的 JSON 契约规范（例如要求最终返回 `{"type": "final", "output": {...}}`）。
4. 在 `background.js` 的 `listSkills()` 函数中注册你所定义的 Skill 信息：
   ```javascript
   {
     id: "my_expert",
     path: "skills/my_expert.skill.md",
     name: "自定义专家分析",
     description: "这里填写你的技能描述",
     icon: "💡",
   }
   ```

---

## 📜 许可证

本项目基于 [MIT License](LICENSE) 协议开源。欢迎任何开发者提交 Issue 或 PR 共同完善此电商增长 Agent。
