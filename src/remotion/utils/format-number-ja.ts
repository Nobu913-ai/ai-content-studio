const NUMBER_TOKEN = /(?:(約)\s*)?(-?\d[\d,]*)(円|万円|%)/g;

export const formatNumberJa = (value: number | string): string => {
  if (typeof value === "number") return value.toLocaleString("ja-JP");
  const normalized = value.replace(/,/g, "");
  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    const num = Number(normalized);
    if (Number.isFinite(num)) {
      return Number.isInteger(num)
        ? num.toLocaleString("ja-JP")
        : num.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
    }
  }
  return value;
};

export const formatNumberWithUnitJa = (
  value: number | string,
  unit = "",
  opts?: { approx?: boolean },
): string => `${opts?.approx ? "約" : ""}${formatNumberJa(value)}${unit}`;

export const formatJapaneseNumericText = (text: string): string =>
  text.replace(NUMBER_TOKEN, (_full, approx: string | undefined, raw: string, unit: string) => {
    const formatted = formatNumberJa(raw);
    return `${approx ?? ""}${formatted}${unit}`;
  });
