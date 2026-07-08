export function productHasImage(image?: string | null): boolean {
  return Boolean(image?.trim());
}
