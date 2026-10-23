import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

let hooked = false

function ensureHook() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderPlain(source: string) {
  return `<p>${escapeHtml(source).replaceAll('\n', '<br>')}</p>`
}

export function renderMarkdown(source: string) {
  ensureHook()
  try {
    const parsed = marked.parse(source, { async: false })
    if (typeof parsed !== 'string') return renderPlain(source)
    const clean = String(DOMPurify.sanitize(parsed, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'del', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
      ALLOWED_ATTR: ['href', 'title', 'colspan', 'rowspan'],
      ALLOW_DATA_ATTR: false,
    }))
    return clean.replace(/<table[\s\S]*?<\/table>/g, (table) => `<div class="table-scroll">${table}</div>`)
  } catch {
    return renderPlain(source)
  }
}

export function markdownToSpeechText(markdown: string) {
  let text = markdown.replace(/\r\n/g, '\n')
  text = text.replace(/```[\s\S]*?```/g, ' ')
  text = text.replace(/`([^`]+)`/g, '$1')
  text = text.replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/^\s*>\s?/gm, '')
  text = text.replace(/^\s*[-*+]\s+/gm, '')
  text = text.replace(/^\s*\d+\.\s+/gm, '')
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
  text = text.replace(/[*_~]/g, '')
  text = text.replace(/\|/g, ' ')
  text = text.replace(/<[^>]+>/g, ' ')
  return text.replace(/\s+/g, ' ').trim()
}
