export function filterTasks<T extends { text: string }>(tasks: T[], query: string): T[] {
  const term = query.trim().normalize("NFC").toLowerCase();
  return tasks.filter((task) => task.text.normalize("NFC").toLowerCase().includes(term));
}
