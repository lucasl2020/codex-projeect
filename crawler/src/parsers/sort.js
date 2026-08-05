/**
 * Sort products: price ASC (nulls last), warranty_days DESC (nulls last), name ASC.
 * Mutates and returns the same array.
 * @param {Array<{price?: number|null, warranty_days?: number|null, name?: string}>} products
 */
export function sortProducts(products) {
  return products.sort((a, b) => {
    const ap = a.price;
    const bp = b.price;
    if (ap == null && bp != null) return 1;
    if (ap != null && bp == null) return -1;
    if (ap != null && bp != null && ap !== bp) return ap - bp;

    const aw = a.warranty_days;
    const bw = b.warranty_days;
    if (aw == null && bw != null) return 1;
    if (aw != null && bw == null) return -1;
    if (aw != null && bw != null && aw !== bw) return bw - aw;

    return String(a.name || '').localeCompare(String(b.name || ''), 'zh');
  });
}
