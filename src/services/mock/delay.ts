import { ApiError } from '@/services/apiError'

export function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ApiError('cancelled', 'Bạn đã dừng yêu cầu.'))
      return
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new ApiError('cancelled', 'Bạn đã dừng yêu cầu.'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
