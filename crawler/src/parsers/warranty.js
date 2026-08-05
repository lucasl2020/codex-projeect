/**
 * Parse warranty text into days.
 * "永久" / lifetime-like → 36500
 * @param {string|null|undefined} raw
 * @returns {{ days: number|null, raw: string|null }}
 */
export function parseWarranty(raw) {
  if (raw == null) return { days: null, raw: null };
  const text = String(raw).trim();
  if (!text) return { days: null, raw: null };

  const lower = text.toLowerCase();
  if (
    /永久|终身|lifetime|forever|unlimited|无期限|长质保|保永久/.test(text) ||
    /lifetime|forever|unlimited/.test(lower)
  ) {
    return { days: 36500, raw: text };
  }

  const year = text.match(/(\d+(?:\.\d+)?)\s*(年|year|years|yr|yrs)/i);
  if (year) {
    return { days: Math.round(Number(year[1]) * 365), raw: text };
  }

  const month = text.match(/(\d+(?:\.\d+)?)\s*(个?月|month|months|mo)/i);
  if (month) {
    return { days: Math.round(Number(month[1]) * 30), raw: text };
  }

  const day = text.match(/(\d+(?:\.\d+)?)\s*(天|日|day|days)/i);
  if (day) {
    return { days: Math.round(Number(day[1])), raw: text };
  }

  const after = text.match(/(?:质保|保修|售后)\s*[:：]?\s*(\d+)/);
  if (after) {
    return { days: Number(after[1]), raw: text };
  }

  return { days: null, raw: text };
}

/**
 * Pull warranty-looking substring from a larger blob of card text.
 * @param {string} blob
 */
export function extractWarrantySnippet(blob) {
  if (!blob) return null;
  const m = String(blob).match(
    /(?:质保|保修|售后|warranty)[^，。,\n]{0,24}/i
  );
  return m ? m[0].trim() : null;
}
