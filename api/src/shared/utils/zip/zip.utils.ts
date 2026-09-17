import archiver = require('archiver');
import { PassThrough } from 'stream';

export interface ZipEntry {
    name: string;
    content: Buffer | string;
}

export async function createZipBuffer(entries: ZipEntry[]): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = new PassThrough();
    const chunks: Buffer[] = [];

    output.on('data', (chunk) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
        output.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', reject);
    });

    archive.pipe(output);
    for (const entry of entries) archive.append(entry.content, { name: entry.name });
    await archive.finalize();

    return done;
}
