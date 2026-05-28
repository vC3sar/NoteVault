const blockEditors = new Map();

export function registerBlockEditor(type, handler) {
  if (!type || typeof handler !== "function") return;
  blockEditors.set(type, handler);
}

export function getBlockEditor(type) {
  return blockEditors.get(type) || null;
}
