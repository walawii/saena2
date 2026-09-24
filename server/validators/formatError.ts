export function getErrorMessage(error: any): string {
  if (!error) return 'Input tidak valid';
  if (Array.isArray(error.issues) && error.issues.length > 0) {
    return error.issues[0]?.message || 'Input tidak valid';
  }
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0]?.message || 'Input tidak valid';
  }
  return error.message || 'Input tidak valid';
}
