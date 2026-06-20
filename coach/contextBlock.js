/**
 * Format editor context for LLM prompts.
 */
export function buildContextBlock(editorContext) {
  if (!editorContext || typeof editorContext !== 'object') return '';

  const lines = ['\n\n【编辑器上下文（用户已授权，可直接写入 prompt 的 context 层，勿用 [待确认] 替代）】'];

  if (editorContext.fileName) {
    lines.push(`- 文件：${editorContext.fileName}`);
  }
  if (editorContext.languageId) {
    lines.push(`- 语言：${editorContext.languageId}`);
  }
  if (editorContext.symbol) {
    lines.push(`- 光标所在符号：${editorContext.symbol}`);
  }
  if (editorContext.line) {
    lines.push(`- 光标行：${editorContext.line}`);
  }
  if (editorContext.selection?.trim()) {
    const code = editorContext.selection.trim().slice(0, 2000);
    lines.push(`- 选中代码：\n\`\`\`\n${code}\n\`\`\``);
  }
  if (Array.isArray(editorContext.diagnostics) && editorContext.diagnostics.length) {
    lines.push('- 当前报错/警告：');
    for (const d of editorContext.diagnostics) {
      lines.push(`  - line ${d.line} [${d.severity}]: ${d.message}`);
    }
  }

  if (lines.length <= 1) return '';
  return lines.join('\n');
}
