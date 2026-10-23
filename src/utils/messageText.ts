import type { ChatMessage, SourceReference } from '@/types/chat'
import { legalPosition } from '@/utils/text'
import { markdownToSpeechText } from '@/utils/markdown'

function sourceLine(source: SourceReference) {
  const position = legalPosition(source).join(', ')
  return [source.documentName, source.documentNumber, source.title, position, source.excerpt]
    .filter((item): item is string => Boolean(item))
    .join(' — ')
}

export function assistantCopyText(message: ChatMessage) {
  const parts: string[] = []
  const summary = message.structured?.summary?.trim() ?? ''
  const content = message.content.trim()
  const analysis = message.structured?.analysis?.trim() ?? ''
  if (summary) parts.push(summary)
  if (content && content !== summary) parts.push(content)
  if (analysis && analysis !== content && analysis !== summary) parts.push(analysis)
  if (message.structured?.exceptions) parts.push(message.structured.exceptions)
  if (message.structured?.conditions) parts.push(message.structured.conditions)
  if (message.structured?.notes) parts.push(message.structured.notes)
  const lines = [...(message.structured?.legalBases ?? []), ...(message.sources ?? [])]
    .map(sourceLine)
    .filter(Boolean)
  if (lines.length) parts.push(lines.join('\n'))
  return parts.join('\n\n').trim()
}

export function assistantSpeechText(message: ChatMessage) {
  const parts: string[] = []
  const summary = message.structured?.summary?.trim() ?? ''
  if (summary) parts.push(summary)
  const spokenContent = markdownToSpeechText(message.content)
  if (spokenContent && spokenContent !== summary) parts.push(spokenContent)
  const analysis = message.structured?.analysis?.trim() ?? ''
  if (analysis && analysis !== message.content.trim() && analysis !== summary) {
    parts.push(markdownToSpeechText(analysis))
  }
  if (message.structured?.exceptions) parts.push(`Ngoại lệ. ${message.structured.exceptions}`)
  if (message.structured?.conditions) parts.push(`Điều kiện áp dụng. ${message.structured.conditions}`)
  if (message.structured?.notes) parts.push(`Lưu ý. ${message.structured.notes}`)
  const names = [...(message.structured?.legalBases ?? []), ...(message.sources ?? [])]
    .map((source) => source.documentName || source.title)
    .filter((name): name is string => Boolean(name))
  if (names.length) parts.push(`Nguồn tham khảo. ${names.join('. ')}`)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
