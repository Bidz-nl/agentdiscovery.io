export function useNativeServiceMatch() {
  if (process.env.ADP_NATIVE_SERVICE_MATCH === '1') {
    return true
  }

  if (process.env.ADP_NATIVE_SERVICE_MATCH === '0') {
    return false
  }

  if (process.env.NODE_ENV === 'development') {
    return true
  }

  return process.env.VERCEL_ENV === 'preview'
}
