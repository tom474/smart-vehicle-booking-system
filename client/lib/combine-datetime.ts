export const combineDateTime = (date: Date, time: string): Date => {
  if (!date || !time) return date

  const [hours, minutes] = time.split(":").map(Number)
  const newDate = new Date(date)
  newDate.setHours(hours, minutes)
  return newDate
}
