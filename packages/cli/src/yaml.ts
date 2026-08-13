function scalar(raw: string): unknown {
  const value = raw.trim();
  if (['', 'null', '~'].includes(value)) return null;
  if (value === 'true' || value === 'false') return value === 'true';
  if (/^\d+$/.test(value)) return Number(value);
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean).map(scalar);
  }
  if (value.startsWith('{') && value.endsWith('}')) {
    return Object.fromEntries(value.slice(1, -1).split(',').filter(Boolean).map((part) => {
      const index = part.indexOf(':');
      if (index < 0) throw new Error(`Invalid inline YAML mapping: ${value}`);
      return [part.slice(0, index).trim(), scalar(part.slice(index + 1))];
    }));
  }
  return value.replace(/^['"]|['"]$/g, '');
}

export function parseYaml(text: string): Record<string, any> {
  const lines = text.split(/\r?\n/).map((raw) => ({
    indent: raw.length - raw.trimStart().length,
    text: raw.trim(),
  })).filter((line) => line.text && !line.text.startsWith('#'));
  if (!lines.length) return {};
  function block(start: number, indent: number): { value: any; index: number } {
    const list = lines[start].text.startsWith('- ');
    const value: any = list ? [] : {};
    let index = start;
    while (index < lines.length) {
      const line = lines[index];
      if (line.indent < indent) break;
      if (line.indent > indent) throw new Error(`Unexpected YAML indentation: ${line.text}`);
      if (list) {
        if (!line.text.startsWith('- ')) break;
        const first = line.text.slice(2).trim();
        const item: Record<string, unknown> = {};
        const separator = first.indexOf(':');
        if (separator < 0) { value.push(scalar(first)); index += 1; continue; }
        item[first.slice(0, separator).trim()] = scalar(first.slice(separator + 1));
        index += 1;
        while (index < lines.length && lines[index].indent > indent) {
          const child = lines[index];
          const split = child.text.indexOf(':');
          if (split < 0) throw new Error(`Invalid YAML mapping: ${child.text}`);
          const key = child.text.slice(0, split).trim();
          const raw = child.text.slice(split + 1);
          if (raw.trim()) { item[key] = scalar(raw); index += 1; }
          else { const parsed = block(index + 1, lines[index + 1].indent); item[key] = parsed.value; index = parsed.index; }
        }
        value.push(item);
      } else {
        const split = line.text.indexOf(':');
        if (split < 0) throw new Error(`Invalid YAML mapping: ${line.text}`);
        const key = line.text.slice(0, split).trim();
        const raw = line.text.slice(split + 1);
        index += 1;
        if (raw.trim()) value[key] = scalar(raw);
        else if (index < lines.length && lines[index].indent > indent) {
          const parsed = block(index, lines[index].indent); value[key] = parsed.value; index = parsed.index;
        } else value[key] = {};
      }
    }
    return { value, index };
  }
  return block(0, lines[0].indent).value;
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `[${value.map(formatScalar).join(', ')}]`;
  const text = String(value);
  if (text === '') return '""';
  return /[:#\[\]{},]|^\s|\s$/.test(text) ? JSON.stringify(text) : text;
}

export function stringifyYaml(value: Record<string, any> | any[], indent = 0): string {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) return value.map((item) => {
    const entries = Object.entries(item);
    const [firstKey, firstValue] = entries[0]!;
    const first = `${pad}- ${firstKey}: ${formatScalar(firstValue)}`;
    const rest = entries.slice(1).map(([key, child]) => {
      if (child && typeof child === 'object' && !Array.isArray(child)) return `${pad}  ${key}:\n${stringifyYaml(child, indent + 4)}`;
      return `${pad}  ${key}: ${formatScalar(child)}`;
    });
    return [first, ...rest].join('\n');
  }).join('\n');
  return Object.entries(value).map(([key, child]) => {
    if (Array.isArray(child) && child.some((x) => typeof x === 'object')) return `${pad}${key}:\n${stringifyYaml(child, indent + 2)}`;
    if (child && typeof child === 'object' && !Array.isArray(child)) return `${pad}${key}:\n${stringifyYaml(child, indent + 2)}`;
    return `${pad}${key}: ${formatScalar(child)}`;
  }).join('\n');
}
