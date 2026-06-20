/**
 * 模糊 / 随意输入的处理原则
 */

export const VAGUE_INPUT_RULES = `
## 模糊输入识别（分析阶段必做）

先把用户输入分为三档 input_quality：
- clear：能看出来要做什么（有动词+对象，或具体页面/功能）
- vague：太笼统、过短、情绪化、或只有「帮我改一下」「不行」「优化」
- off_topic：明显不是让 Cursor 写代码的事（闲聊、作业、翻译等）

### 典型 vague 例子（不要直接生成完整提示词）
- 「帮我」「改一下」「优化」「fix」「aaaa」「不行」「还是不对」
- 少于 6 个字且没有具体功能名
- 只有形容词没有动作：「好看一点」「快一点」

### 分析阶段规则
1. vague 或 off_topic 时：**禁止 ready=true**，必须先追问
2. vague 时第一题优先问「你到底想做什么」，给 3 个**从用户原话能猜到的**方向 +「我都不确定，重新描述」
3. off_topic 时 questions 只留一题：引导用户改成 Cursor 能做的事，选项给常见场景
4. 不要从 vague 输入里**编造**文件名、API、技术方案

### 生成阶段规则（用户答完或勉强 clear）
1. 信息不足时：**宁可多写 [待确认]**，不要假装知道
2. 用户多题选「我不确定，你帮我选」→ confidence=low，prompt 里加：
   <before_coding>先列出你的理解，向用户确认 1-2 个关键点后再改代码</before_coding>
3. task/context 里禁止出现用户没提过的具体路径，用 [待确认：页面或文件] 占位
4. summary 必须诚实：「你开头说得比较模糊，我先搭了个架子，Cursor 可能还要再问你」
5. 反幻觉：没提到的功能、字段、接口一律不写，只写 [待确认]`;

export const VAGUE_JSON_FIELDS = `
额外 json 字段（分析、生成都要带）：
- input_quality: "clear" | "vague" | "off_topic"
- confidence: "high" | "medium" | "low"（仅 ready=true 时）
- vague_notice: 一句大白话提醒（vague/low 时必填，否则 null）`;
