/**
 * 提炼自 prompt-architect 技能手册（SKILL.md）
 */

export const CURSOR_CODE_LAYERS = `
## 六层架构（代码场景精简版，来自跨平台共识）

只填用户已提供或能推断的层，缺的用追问补，不要硬凑：

| 层 | 作用 | Cursor 里写什么 |
|----|------|----------------|
| ROLE | 激活正确知识域 | 一句：熟悉本项目的 [语言] 工程师（勿写长背景） |
| TASK | 锁定方向 | 动词+宾语，具体可执行 |
| CONTEXT | 框定边界 | 文件/函数/页面 + 项目约束 |
| EXAMPLES | 锚定「怎样算对」 | 1-2 个「场景 → 预期结果」，Few-shot 风格 |
| FORMAT | 控制输出形态 | 改哪些文件、要不要测试、输出摘要格式 |
| CONSTRAINT | 防线 | 正向表述为主 + 不要动什么 + 不确定时标注勿猜 |

简单任务：TASK + CONTEXT + CONSTRAINT + 1 个 EXAMPLE 即可。
复杂任务：补全 ROLE + FORMAT。`;

export const ANTI_PATTERNS = `
## 必须规避的反模式（生成时自动修正）

| 反模式 | 修正 |
|--------|------|
| 模糊动词（「优化一下」「合适的」） | 换成具体动词和可验证描述 |
| 纯负面指令堆叠 | 改成正向：「只改 X」「保持 Y 不变」 |
| 无示例的复杂任务 | 补 1-2 个 success_examples |
| 角色背景过长 | ROLE 限一句话 |
| 无失败处理 | 加：不确定处标注 [待确认]，不要猜测 |
| 约束超过 5 条无结构 | 用 XML 分节，每节 ≤5 条 |`;

export const CURSOR_FEATURE_TEMPLATE = `
## 输出模板（写新功能 · Claude/Cursor 友好 XML）

prompt 字段正文必须是以下结构（不要用外层 markdown 代码块）：

---
<role>
你是熟悉本项目的软件工程师，写法与仓库现有代码一致。
</role>

<task>
[一句话：具体动词 + 要做什么]
</task>

<context>
- 位置：[文件/函数/页面]
- 背景：[用户已说的上下文；无则省略此行]
- 参考：[类似实现；无则写「按项目现有风格」]
</context>

<success_examples>
- [场景1] → [预期结果1]
- [场景2] → [预期结果2]（可选）
</success_examples>

<constraints>
- [正向约束，如：只新增必要代码，不重构无关部分]
- [不要动：具体文件/模块]
- 不确定的信息标注 [待确认]，不要猜测
</constraints>

<output_format>
- 先说明改动计划，再改代码
- 完成后用 3 条以内摘要说明改了什么
</output_format>
---`;

export const CURSOR_FIX_TEMPLATE = `
## 输出模板（纠正 AI · 修正提示词）

prompt 字段正文：

---
<role>
你是熟悉本项目的软件工程师。本次任务是修正上一版错误改动，不是重新自由发挥。
</role>

<task>
撤销/修正上一版中不符合要求的部分，并按正确做法完成用户需求。
</task>

<problem>
[AI 做错了什么：改多了 / 改错文件 / 理解偏了]
</problem>

<correct_approach>
[用户真正要什么，具体可执行]
</correct_approach>

<context>
- 只改这里：[范围]
- 可以参考：[如有]
</context>

<success_examples>
- 修正后 [场景] → [预期]
</success_examples>

<constraints>
- 不要动：[必须保持不变的文件/逻辑]
- 先恢复被误改部分，再做正确修改
- 不确定处标注 [待确认]
</constraints>

<output_format>
说明：①撤销了什么 ②改了什么 ③如何验证
</output_format>
---`;

export const ANALYZE_LAYER_MAP = `
## 追问与六层映射（内部用，问题仍用大白话）

写新功能缺什么就问什么：
- 缺 CONTEXT（改哪里）→ 问页面/文件/功能块
- 缺 EXAMPLES（怎样算好）→ 问「举个小例子，怎样算做好了」
- 缺 CONSTRAINT（别动什么）→ 问「有哪些地方绝对不能改坏」
- 缺 CONTEXT 参考 → 问「项目里有没有类似功能可以照着写」

纠正 AI 缺什么就问什么：
- 缺 problem → 「AI 改坏哪里了？」
- 缺 correct_approach → 「你原本想改成啥样？」
- 缺 CONSTRAINT → 「哪些部分不能动？」`;

export const GENERATION_RULES = `
## 生成规则（科学 + 精简）

1. 遵循 Context Engineering：能删则删，保留最小高信噪比信息（目标 200-320 字）
2. 开发者场景优先 RTF+TCEF：Role + Task + Context + Examples + Format + Constraint
3. 对 Cursor 使用 XML 分节（Claude 母语），不用 CO-STAR 等空框架名
4. summary 用 2-3 句大白话说明：补了哪几层、修掉了哪个反模式
5. before 写用户原来那句模糊话
6. 只输出合法 json`;
