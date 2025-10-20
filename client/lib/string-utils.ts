
export function capitalize(word: string) {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}

export function splitStr(str: string): string {
  return splitCamelCase(str).join(" ")
}

export function splitCamelCase(str: string) {
  if (!str || typeof str !== 'string') {
    return [];
  }

  // Split on word boundaries before uppercase letters
  return str.split(/(?=[A-Z])/).filter(word => word.length > 0);
}

export function truncateString(str: string, limit: number = 50): string {
  if (str.length > limit) {
    return str.slice(0, limit) + "...";
  }
  return str;
}
