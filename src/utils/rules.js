// Local classification engine.
// Maps an ActivityWatch window event (app + title) to a TimeLens category,
// its Obsidian-Dark color, glow, status glyph, and whether it counts as
// "productive" focus time. Order matters: the first matching rule wins.

export const CATEGORIES = {
  project: {
    key: 'project',
    label: '项目开发',
    color: '#6EE7B7',
    glow: 'rgba(110,231,183,0.40)',
    status: '🟢',
    productive: true,
  },
  coding: {
    key: 'coding',
    label: '编程开发',
    color: '#818CF8',
    glow: 'rgba(129,140,248,0.40)',
    status: '🟢',
    productive: true,
  },
  learning: {
    key: 'learning',
    label: '学习资料',
    color: '#FCD34D',
    glow: 'rgba(252,211,77,0.38)',
    status: '🟡',
    productive: true,
  },
  ai: {
    key: 'ai',
    label: 'AI 工具',
    color: '#67E8F9',
    glow: 'rgba(103,232,249,0.40)',
    status: '🔵',
    productive: true,
  },
  comms: {
    key: 'comms',
    label: '沟通协作',
    color: '#F9A8D4',
    glow: 'rgba(249,168,212,0.36)',
    status: '🟣',
    productive: false,
  },
  entertainment: {
    key: 'entertainment',
    label: '娱乐摸鱼',
    color: '#FCA5A5',
    glow: 'rgba(252,165,165,0.42)',
    status: '🔴',
    productive: false,
  },
  neutral: {
    key: 'neutral',
    label: '系统/其他',
    color: '#A0A0B8',
    glow: 'rgba(160,160,184,0.22)',
    status: '⚪',
    productive: false,
  },
  idle: {
    key: 'idle',
    label: '空闲',
    color: '#505068',
    glow: 'rgba(80,80,104,0.20)',
    status: '⚫',
    productive: false,
  },
}

// Each rule: [categoryKey, /regex/i, human-readable reason fragment].
const RULES = [
  ['project', /(jiezi|idea-forge|multi-agent|jianxun|rl-foundation|chen-taeo|arduino|platformio|robot)/i, '自有项目关键词'],
  ['coding', /(cursor|code\.exe|visual studio|vscode|pycharm|intellij|webstorm|goland|clion|sublime|neovim|\bvim\b|terminal|powershell|cmd\.exe|wsl|windows terminal|github\.com|gitlab|stackoverflow|stack overflow|\bnpm\b|pypi|developer\.mozilla|\bmdn\b|localhost)/i, '开发工具 / 代码平台'],
  ['ai', /(chatgpt|openai|claude\.ai|anthropic|deepseek|poe\.com|huggingface|hugging face|gemini|copilot|perplexity)/i, 'AI 工具域名'],
  ['learning', /(arxiv|zhihu|知乎|csdn|掘金|juejin|medium|wikipedia|coursera|udemy|course|tutorial|obsidian|notion|typora|onenote|zotero|\.pdf|微信读书|documentation|\bdocs\b)/i, '学习 / 阅读平台'],
  ['comms', /(wechat|微信|\bqq\b|discord|slack|teams|飞书|lark|钉钉|dingtalk|outlook|gmail|mail|telegram|whatsapp)/i, '通讯 / 协作应用'],
  ['entertainment', /(bilibili|b站|youtube|netflix|抖音|douyin|tiktok|微博|weibo|爱奇艺|iqiyi|腾讯视频|steam|epic games|game|potplayer|网易云|netease music|spotify|twitch|instagram|reddit)/i, '娱乐 / 流媒体'],
]

const OVERRIDES_KEY = 'timelens-overrides'

export function loadOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addOverride(pattern, categoryKey) {
  const p = pattern.toLowerCase().trim()
  if (!p) return
  const list = loadOverrides().filter((o) => o.pattern !== p)
  list.unshift({ pattern: p, categoryKey, createdAt: Date.now() })
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(list.slice(0, 50)))
}

export function removeOverride(pattern) {
  const p = pattern.toLowerCase().trim()
  localStorage.setItem(
    OVERRIDES_KEY,
    JSON.stringify(loadOverrides().filter((o) => o.pattern !== p))
  )
}

function matchOverride(text) {
  for (const o of loadOverrides()) {
    if (text.includes(o.pattern) && CATEGORIES[o.categoryKey]) {
      return {
        category: CATEGORIES[o.categoryKey],
        because: `你的纠正 · 匹配「${o.pattern}」`,
        ruleIndex: null,
        overridePattern: o.pattern,
      }
    }
  }
  return null
}

export function categorize(app = '', title = '') {
  return categorizeDetailed(app, title).category
}

/** Returns category plus a legible "because" for the honest mirror UI. */
export function categorizeDetailed(app = '', title = '') {
  const text = `${app} ${title}`.toLowerCase()
  const override = matchOverride(text)
  if (override) return override

  for (let i = 0; i < RULES.length; i++) {
    const [key, regex, reasonHint] = RULES[i]
    if (regex.test(text)) {
      const snippet = title?.slice(0, 48) || app || ''
      return {
        category: CATEGORIES[key],
        because: snippet ? `${reasonHint} · ${snippet}` : reasonHint,
        ruleIndex: i + 1,
      }
    }
  }
  const snippet = title?.slice(0, 48) || app || '未知窗口'
  return {
    category: CATEGORIES.neutral,
    because: `未匹配规则 · ${snippet}`,
    ruleIndex: 0,
  }
}

export function isProductive(categoryKey) {
  return CATEGORIES[categoryKey]?.productive ?? false
}

// Short labels for the minimal capsule (color carries the category).
export const SHORT_LABELS = {
  project: '项目',
  coding: '编程',
  learning: '学习',
  ai: 'AI',
  comms: '沟通',
  entertainment: '摸鱼',
  neutral: '其他',
  idle: '空闲',
}

export function shortLabel(categoryKey) {
  return SHORT_LABELS[categoryKey] || SHORT_LABELS.neutral
}

/** Suggested category when user says "this isn't X". */
export function correctionTarget(currentKey) {
  const map = {
    entertainment: 'learning',
    neutral: 'coding',
    comms: 'learning',
  }
  return map[currentKey] || 'learning'
}
