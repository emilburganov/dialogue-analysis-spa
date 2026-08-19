import type { ApiError } from '@/types/auth'

export class ApiValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>

  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message)
    this.name = 'ApiValidationError'
    this.fieldErrors = fieldErrors
  }
}

export function createApiValidationError(payload: ApiError | null): ApiValidationError {
  const fieldErrors = payload?.errors ?? {}

  return new ApiValidationError(
    payload?.message ?? 'Произошла ошибка при выполнении запроса.',
    fieldErrors,
  )
}

export function applyApiFieldErrors(
  error: unknown,
  setFieldError: (field: string, message: string) => void,
): boolean {
  if (!(error instanceof ApiValidationError)) {
    return false
  }

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    const message = messages[0]

    if (message) {
      setFieldError(field, message)
    }
  }

  return true
}
