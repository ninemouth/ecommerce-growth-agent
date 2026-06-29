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
│   ├── toolRegistry.js        # 自动化工具箱注册 (含系统页面脚本注入安全校验与搜索校准)
│   └── agentLoop.js           # Agent 自主思考-动作-反思状态机循环 (含智能 JSON 修复)
└── skills/                    # 专家 Skill 提示词目录 (可根据业务场景自定义)
    ├── taobao_homepage_explorer.skill.md
    ├── etsy_crossborder_explorer.skill.md
    ├── ecommerce_page_analyzer.skill.md
    ├── global_shop_optimizer.skill.md
    ├── amazon_listing_generator.skill.md
    ├── etsy_keyword_analysis.skill.md
    ├── competitor_review_analysis.skill.md
    ├── product_opportunity_scorer.skill.md
    ├── tiktok_shop_trend_analyzer.skill.md    # [New] TikTok 爆量分析
    ├── temu_semi_managed_evaluator.skill.md    # [New] Temu 半托管风控评估
    ├── event_driven_trend_radar.skill.md       # [New] 事件驱动型趋势机会雷达
    └── omnichannel_traffic_planner.skill.md    # [New] 全域流量规划与投流审计专家
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

1. **获取源码**（选择以下任意一种方式）：
   * **方式 A (直接下载 ZIP 压缩包)**：点击 GitHub 页面右上角的 `Code` ➡️ **`Download ZIP`**，下载后解压到本地。
   * **方式 B (Git 命令行)**：`git clone https://github.com/ninemouth/ecommerce-growth-agent.git`
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角「**开发者模式**」
4. 点击「**加载已解压的扩展程序**」，选择刚刚解压或 Clone 下来的 `ecommerce-growth-agent` 文件夹
5. 在侧边栏的“设置 (⚙️)”中配置你习惯的 LLM Provider（如 OpenAI, Anthropic, Qwen, SiliconFlow, Groq 等）及 API Key 即可开始使用。

---

## 🛠️ 内置工具箱 (Agent Tools)

Agent 在执行任务时，可以自由组合并调用以下底层的浏览器自动化工具：

| 工具名称 | 参数 | 说明 |
|----------|------|------|
| `read_current_page` | 无 | 抓取当前活动页面的标题、价格、评分、部分可视正文及核心图片 |
| `extract_product_info` | 无 | 将页面 DOM 数据进行初筛，格式化为标准商品对象 |
| `get_selected_text` | 无 | 读取用户在当前网页上手动框选的文本内容 |
| `click_by_text` | `text` (字符串) | 在页面中寻找匹配该文本的按钮并执行点击 (如翻页或过滤差评) |
| `search_web` | `query` (词), `engine` | **自动本地化翻译**并搜索 Google/Amazon/Etsy 并跳转加载 |
| `navigate_to` | `url` (链接) | 驱动 Tab 直接跳转到目标网页并等待渲染完成 |
| `query_market_data` | `keyword`, `platform` | 从 Helium 10 或 卖家精灵拉取真实销量大盘数据 (未配置Key时自动置灰隐藏) |
| `save_result` | `args` | 将 Agent 报告保存至本地“结果库”中 |
| `get_saved_results` | `limit` | 读取本地历史保存的分析记录 |
| `open_new_tab` | `url` (链接) | 隐式在新标签页打开 URL 并等待渲染加载，获取 DOM 文本返回给 Agent |
| `close_tab` | `tabId` (数字) | 关闭指定 ID 的标签页，保持浏览器干净 |
| `save_ad_plan` | `plan` (对象) | 将首期投流规划数据持久化保存到 `chrome.storage.local`，以支持历史数据对比 |
| `get_ad_plan` | 无 | 从本地存储中检索历史已保存的投流策划案 |

---

## 📊 三方选品数据 API 集成（置灰机制）

在侧边栏“设置”页中，你可以配置以下两个三方商业 API：
*   **Helium 10 API Key**: 激活亚马逊/Etsy 市场的真实销量估算与关键词 Magnet 大盘数据查询。
*   **卖家精灵 API Key**: 激活国内与跨境市场的真实搜索量、购买率及竞品 BSR 指标。

### 🛡️ 智能置灰不可用机制
*   **UI 层面**：未配置 Key 时，主界面状态灯呈灰色显示 `三方数据: 未激活`，配置任一 Key 后自动亮绿灯 `三方数据: 已激活`。
*   **Harness 屏蔽层**：当 API 未配置时，Harness 在向 Agent (大模型) 暴露可用工具列表时，会**彻底移除 `query_market_data` 的声明**。大模型由于在认知边界内看不到该工具，绝对不会进行尝试调用，从机制上实现了“完美置灰”。

### 数据查询 JSON 契约示例

* **Agent 调用指令**：
```json
{
  "type": "tool_call",
  "tool": "query_market_data",
  "arguments": {
    "keyword": "personalized acrylic guest book",
    "platform": "amazon"
  }
}
```

* **Harness 返回的真实 API 数据**：
```json
{
  "ok": true,
  "provider": "Helium 10 (Cerebro/Magnet)",
  "keyword": "personalized acrylic guest book",
  "metrics": {
    "search_volume": 24800,
    "competing_products": 1200,
    "magnet_score": 3820,
    "monthly_sales_estimate": 850,
    "cpr_8_day_estimate": 12,
    "source": "Helium 10 Magnet API"
  }
}
```

---

## 🔍 智能搜索地道本地化校准 (Local Search Optimization)

大模型在执行搜索任务（如跨境选品）时，如果用户输入的是中文或生硬直译词，往往会导致目标平台（如 Etsy/Amazon）搜索结果偏差。
*   **Harness 级拦截**：`search_web` 工具在执行前，若检测到目标平台为海外站点且搜索词中包含中文，会自动拦截并向 LLM 发送一个快速请求进行“地道搜索词校准”。
*   **语义转换示例**：
    *   用户输入: `“婚礼亚克力定制留言牌”` 
    *   AI 直译: `“wedding custom acrylic card”` (搜索量极低，商品失真)
    *   **地道化校准后**: `“Acrylic Wedding Guest Book”` (海外消费者高频真实搜索词)
*   **效果**：彻底杜绝机器直译带来的搜索偏差，保证抓取到的竞品对比列表 100% 贴合目标市场的真实流量生态。

## 📖 真实场景运行示例 (Usage Examples)

### 示例 1：利用“全网竞品 Review 痛点分析”进行反向选品开发
* **运行场景**：在亚马逊某款热销空调（Amazon Basics Air Conditioner）详情页上启动该 Skill。
* **Harness 运行日志**：
  ```
  🚀 执行 Skill: 全网竞品 Review 痛点分析
  📖 加载 skill: skills/competitor_review_analysis.skill.md
  🌐 读取当前页面上下文...
  ⚙️ 调用工具: click_by_text (自动定位并模拟点击 "1 星/One star" 过滤差评)
  ⚙️ 调用工具: read_current_page (获取深层差评 DOM 文本数据)
  ✅ 完成 (3 步)
  ```
* **AI 最终输出报告 (Markdown 渲染后)**：
  > ### 1. 核心发现与维度速览
  > * **分析对象**：Amazon Basics 6000-BTU Window Air Conditioner
  > * **核心痛点**：噪音问题占 1 星评价的 70% 以上，主要是压缩机震动共振和外壳碰擦声，是导致用户退换货的元凶。
  > * **品控漏洞**：遥控板按键批次性失灵，反映出供应链质量把控不严。
  > * **隐性需求**：垂直窗户安装、单人简易快速安装、App 控制未被完全满足。
  >
  > ### 2. 差异化改进方案 (中国供应链机会)
  > * **静音技术降维**：国内供应链可引入“防共振阻尼垫”与“双滚珠静音电机”，将工作噪音控制在 38dB 以下（竞品为 56dB），作为高溢价卖点。
  > * **极简安装设计**：升级折叠窗框配件，支持单人 5 分钟免工具安装，直接击中海外高昂人工安装费的痛点。

### 示例 2：利用“Temu 半托管低毛利风控评估器”进行利润核算
* **运行场景**：在 1688 上看到一款户外折叠桌，评估是否适合备货到海外仓在 Temu 半托管模式下销售。
* **用户指令输入**：`“采购价 65 元，头程海运费 15 元”`
* **AI 最终输出报告 (Markdown 渲染后)**：
  > ### 1. 财务核算指标
  > * **核价红线预测**：对标亚马逊同类竞品，预测 Temu 半托管核价上限为 $23.99。
  > * **成本结构拆解**：
  >   - 出厂及头程 (换算为美金)：$11.10
  >   - 海外仓末端配送费 (USPS/UPS): $11.50 (因重货原因，运费占比高达 47.9%)
  >   - 海外仓仓储准备金：$1.20
  >   - **预估保底利润率**：0.8% ($0.19)
  >
  > ### 2. 最终风控结论：【坚决否定 (REJECT)】
  > 该商品属于典型的“重货低货值”产品，末端派送运费吃光了全部毛利。一旦遇到 Temu 竞价系统二次核价压价或买家退货，将直接亏损。建议放弃备货。

### 示例 3：利用“全域流量规划与投流审计专家”进行多角色投流推演与监测
* **运行场景**：用户在某款制冰机详情页启动该 Skill，在侧边栏结构化输入：预算 $5,000，周期 14 天，平台选择 Meta Ads + TikTok Shop。
* **Harness 运行日志**：
  ```
  🚀 执行 Skill: 全域流量规划与投流审计专家 (Auto)
  📖 加载 base: skills/base_report_auditor.skill.md
  📖 加载 skill: skills/omnichannel_traffic_planner.skill.md
  🌐 读取当前页面上下文...
  ⚙️ 调用工具: get_ad_plan (未检测到历史规划，判定为模式二: 14天沙盘推演)
  ⚙️ 调用工具: open_new_tab (自动在 Amazon 搜索竞品制冰机)
  ⚙️ 调用工具: close_tab (读取竞品价位数据后，自动关闭搜索标签页)
  ⚙️ 调用工具: save_ad_plan (持久化保存首期方案)
  ✅ 完成 (5 步)
  ```
* **AI 最终输出报告 (Markdown 渲染后)**：
  > ### 1. 投流项目基本情况与目标定位
  > * **分析对象**：Silonn 颗粒冰制冰机
  > * **总预算/周期**：$5,000 / 14天 (冷启动沙盘推演模式)
  > 
  > ### 2. 14天投流推演沙盘日记 (Day 1 - Day 14)
  > * **Day 1-3 (冷启动)**：测试 Meta ASC 计划。由于首周跑算法人群，单日消耗控制在 $150 左右，ROAS 表现为 1.1。投放经理 (Ad Ops) 手动设置 CPA 上限为 $22 守底线。
  > * **Day 4-7 (素材寿命预警)**：发现 TikTok 计划 A 展现成本过高，CFO 执行熔断暂停。创意总监 (Creative) 发现点击率跌至 1.2%，发出素材疲劳预警并更换 3 套全新爆量视频 Hook 脚本，CTR 攀升至 2.4%，ROAS 反弹至 2.3。
  > * **Day 8-12 (稳步扩容)**：高表现广告组跑通，项目总监 (Director) 批准放量指令，每日预算递增 30%，综合 MER 达到 2.2。
  > * **Day 13-14 (Hand-off)**：模型学习完全稳定，最终广告消耗完毕，净利润率 18.5%，成功交割。
  > 
  > ### 3. 实时投流监测模式激活说明
  > 当你完成上述规划并在此商品对应的 Meta/TikTok 广告后台（如 adsmanager.facebook.com）启动本插件时，Skill 会自动切换为【真实投流数据监测模式】，调取本次保存的规划参数，抓取网页实时消耗与 ROAS，在你的真实页面上**绘制 Indigo 靛蓝描边与 AI 引导气泡**（如：在预算框下方提示 *“💡 CFO建议：此处应填入 $50 预算”*），提供面对面手把手指导。

---

## 📂 自定义新增 Skill

每一个 `skill.md` 都是大模型扮演特定运营专家时的 System Prompt。

1. 在 `skills/` 目录下创建一个包含 Markdown 提示词的文件（例如 `my_expert.skill.md`）。
2. 在文件头部或规则中，定义你对大模型的执行步骤约束（Funnel）。
3. 声明输出的 JSON 契约规范（例如要求最终返回 `{"type": "final", "output": {...}}`）。
4. 在 `background.js` 的 `listSkills()` 函数中注册你所定义的 Skill 节点。

---

## 📜 许可证

本项目基于 [MIT License](LICENSE) 协议开源。欢迎任何开发者提交 Issue 或 PR 共同完善此电商增长 Agent。
