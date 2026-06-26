const avatarPalettes = [
  ["#6C63FF", "#00D4A8"],
  ["#FF8A5B", "#6C63FF"],
  ["#00B8D9", "#00D4A8"],
  ["#F7B955", "#FF6B9A"],
  ["#7C3AED", "#38BDF8"],
  ["#14B8A6", "#A3E635"],
];

export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getAvatarStyle(seed = "") {
  const hash = String(seed)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const [from, to] = avatarPalettes[hash % avatarPalettes.length];

  return {
    background: `linear-gradient(135deg, ${from}, ${to})`,
  };
}
