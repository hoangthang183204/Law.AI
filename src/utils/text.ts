import type { SourceReference } from '@/types/chat'

export function fold(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('vi')
}

export function titleFromMessage(content: string) {
  const oneLine = content.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= 56) return oneLine
  return `${oneLine.slice(0, 56).trimEnd()}…`
}

export function safeHttpUrl(value?: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function labeledLegalValue(label: string, value?: string) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.toLocaleLowerCase('vi').startsWith(label.toLocaleLowerCase('vi'))) return trimmed
  return `${label} ${trimmed}`
}

export function legalPosition(source: SourceReference) {
  return [
    labeledLegalValue('Điều', source.article),
    labeledLegalValue('Khoản', source.clause),
    labeledLegalValue('Điểm', source.point),
  ].filter((item): item is string => Boolean(item))
}

export function sameText(left?: string, right?: string) {
  const a = left?.trim() ?? ''
  const b = right?.trim() ?? ''
  return a !== '' && a === b
}

export function safeRedirect(value: unknown) {
  if (typeof value !== 'string') return '/chat'
  if (!value.startsWith('/') || value.startsWith('//')) return '/chat'
  if (value.startsWith('/login') || value.startsWith('/register')) return '/chat'
  return value
}

export async function copyText(text: string) {
  const value = text.trim()
  if (!value) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = value
      area.setAttribute('readonly', 'true')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}
