# 丝场设计参考（调研摘要）

> 2026-06 · 为 TimeLens 丝场 Ambient 态收集的可借鉴方向，**非照搬**。

## 我们要解决的问题

- 屏幕顶中：**多条**细线（不是框、不是 dashboard）
- 默认在** periphery**（余光可感），点击才进 **center**（详情）
- 符合 [Calm Technology](https://fuzzymath.com/blog/calm-technology-enterprise-web-application-ui-design/)：最小注意力、可 periphery ↔ center 切换

---

## 参考案例

### 1. Wave_Thread（Framer / WebGL）

- [Framer Marketplace — Wave_Thread](https://marketplace.framer.com/marketplace/components/wave-thread/)
- **多条** Perlin 噪声驱动的流动线，振幅/相位/鼠标微扰
- **借鉴**：多线参差、有机驻波、hover 微弯（不做全屏 shader）

### 2. Luminal Threads（WebGL 粒子丝）

- [GitHub — luminal-threads](https://github.com/daniel-silva-perez/luminal-threads)
- ~3000 粒子沿 Lissajous 曲线，**40 帧拖尾**、速度映射色相
- **借鉴**：每根丝独立相位；拖尾极淡（Ambient 仅 2–3 帧 ghost stroke）

### 3. Shader Lines / Silk 背景（氛围线场）

- [Framer — Shader Lines](https://www.framer.com/marketplace/components/shader-lines/)
- [shadcn — React Silk Background](https://www.shadcn.io/background/silk)
- **借鉴**：多层 sine 叠加、低对比 glow；**禁止**整屏线场抢焦点

### 4. Dynamic Island 类桌面胶囊（交互范式）

- [Dynamic Island for Windows](https://github.com/devcode90/Dynamic-Island-for-Windows) · [NexNotch](https://github.com/NexVar/NexNotch) · [Notchly](https://notchly.xyz/)
- 小 pill → 悬停/点击展开；媒体/状态在 periphery
- **借鉴**：窗宽不变、纵向生长；**不借鉴** pill 玻璃盒占满屏

### 5. Calm / Peripheral 研究

- [IoT Calm Tech 原则](https://iotclass.org/ux-design/design-model-facets-calm-tech.html) · [Peripheral Interaction 论文](https://www.ijdesign.org/index.php/IJDesign/article/view/4265/1021)
- LED/ambient 缓慢变色、多元素**不同节奏**（ClassBeacons）
- **借鉴**：每根丝 **无理数频比** 去同步；状态（散/齐/缠）用**运动**表达而非文字

### 6. StyleSeed — Silk 动效种子

- [styleseed/engine/motion](https://github.com/bitjaru/styleseed/tree/main/engine/motion)
- Silk = smooth, continuous, elegant
- **借鉴**：Ma 200–500ms；展开/收起用 spring 而非 teleport

---

## TimeLens 采纳矩阵

| 来源 | 采纳 | 拒绝 |
|------|------|------|
| Wave_Thread | 3–5 根、Fib 长度差、鼠标微弯 | 全屏 WebGL、高饱和 |
| Luminal | 相位差、极淡拖尾 | 3000 粒子、CRT 扫描线 |
| Calm Tech | periphery 默认、点击进 center | 常亮通知、modal |
| Dynamic Island | 顶中、纵向展开详情 | 大 pill、hover 展开大板 |
| 品牌 TIMELENS | ● 色只给状态、玻璃只在 Focus | 白底 dashboard、红色恐吓 |

---

## 实现检查清单

- [ ] `bundleH ≥ (n-1)×gap + 波幅余量` — 多根丝**全部**落在窗内
- [ ] 宽屏 5 根 / 窄屏 3 根（原 spec）
- [ ] 每根丝：独立 α、色相微差、线宽 1.4–1.8px
- [ ] Ambient 无框；Detail 点击展开；Fix 仅 `Ctrl+Shift+U`
