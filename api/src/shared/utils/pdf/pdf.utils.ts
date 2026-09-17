import PDFDocument = require('pdfkit');

function collect(doc: PDFKit.PDFDocument): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
}

export async function renderKeyValuePdf(title: string, subtitle: string | null, rows: [string, string][]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const bufferPromise = collect(doc);

    doc.fontSize(18).text(title, { align: 'left' });
    if (subtitle) doc.moveDown(0.3).fontSize(10).fillColor('#666666').text(subtitle);
    doc.moveDown(1).fillColor('#000000');

    for (const [label, value] of rows) {
        doc.fontSize(11).text(`${label}:`, { continued: false });
        doc.fontSize(12).text(String(value ?? ''), { indent: 10 });
        doc.moveDown(0.4);
    }

    doc.end();
    return bufferPromise;
}

export async function renderTablePdf(title: string, headers: string[], rows: (string | number)[][]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 40, layout: 'landscape' });
    const bufferPromise = collect(doc);

    doc.fontSize(16).text(title);
    doc.moveDown(1);

    const columnWidth = (doc.page.width - 80) / headers.length;

    doc.fontSize(9).fillColor('#333333');
    headers.forEach((header, i) => doc.text(header, 40 + i * columnWidth, doc.y, { width: columnWidth, continued: false }));
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fillColor('#000000');
    for (const row of rows) {
        const rowY = doc.y;
        row.forEach((cell, i) => doc.text(String(cell ?? ''), 40 + i * columnWidth, rowY, { width: columnWidth }));
        doc.moveDown(0.6);
        if (doc.y > doc.page.height - 60) doc.addPage({ layout: 'landscape' });
    }

    doc.end();
    return bufferPromise;
}
