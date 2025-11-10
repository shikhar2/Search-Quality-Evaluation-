export const formatTimestamp = (isoString?: string): string => {
  if (!isoString) return 'N/A'
  const date = new Date(isoString)
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}
