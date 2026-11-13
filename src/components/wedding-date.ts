export function formatWeddingDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00+07:00` : value);
  const options = { timeZone: "Asia/Ho_Chi_Minh" };
  return {
    day: new Intl.DateTimeFormat("vi-VN", { ...options, day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("vi-VN", { ...options, month: "2-digit" }).format(date),
    year: new Intl.DateTimeFormat("vi-VN", { ...options, year: "numeric" }).format(date),
    weekday: new Intl.DateTimeFormat("vi-VN", { ...options, weekday: "long" }).format(date),
    time: new Intl.DateTimeFormat("vi-VN", { ...options, hour: "2-digit", minute: "2-digit" }).format(date),
    full: new Intl.DateTimeFormat("vi-VN", { ...options, day: "2-digit", month: "long", year: "numeric" }).format(date),
  };
}
