import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// Local development adapter only. Netlify uses the durable Blobs adapter.
export function createFileStore(directory) {
  let pending = Promise.resolve();
  const read = async key => {
    try {
      const text = await readFile(join(directory, `${key}.json`), 'utf8');
      return { data: JSON.parse(text), etag: createHash('sha256').update(text).digest('hex') };
    } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  };
  return {
    getWithMetadata: read,
    setJSON(key, value, options = {}) {
      const operation = pending.then(async () => {
        const entry = await read(key);
        if ((options.onlyIfNew && entry) || (options.onlyIfMatch && entry?.etag !== options.onlyIfMatch)) return { modified: false };
        await mkdir(directory, { recursive: true });
        const file = join(directory, `${key}.json`);
        await writeFile(`${file}.tmp`, JSON.stringify(value), 'utf8');
        await rename(`${file}.tmp`, file);
        return { modified: true };
      });
      pending = operation.catch(() => {});
      return operation;
    }
  };
}
