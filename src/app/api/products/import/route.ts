export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

const MAX_ROWS = 500;

/**
 * Parse a single CSV line, handling double-quoted fields.
 * e.g.: 'foo,"bar,baz","he said ""hi"""' → ['foo', 'bar,baz', 'he said "hi"']
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote?
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

// POST /api/products/import
// Content-Type: multipart/form-data  field: file (CSV)
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await (file as Blob).text();
    const rawLines = text.split(/\r?\n/);
    const nonEmptyLines = rawLines.filter((l) => l.trim().length > 0);

    if (nonEmptyLines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have a header row and at least one data row' },
        { status: 400 },
      );
    }

    const dataLines = nonEmptyLines.slice(1); // exclude header
    if (dataLines.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ROWS} rows per import. File has ${dataLines.length} data rows.` },
        { status: 400 },
      );
    }

    // Parse header — normalise to lowercase, strip spaces
    const headerFields = parseCsvLine(nonEmptyLines[0]).map((h) =>
      h.toLowerCase().replace(/\s+/g, ''),
    );

    // Map column aliases to canonical names
    const colIndex = (aliases: string[]): number =>
      aliases.reduce((found, alias) => (found !== -1 ? found : headerFields.indexOf(alias)), -1);

    const colName = colIndex(['nama', 'name']);
    const colSku = colIndex(['sku']);
    const colPrice = colIndex(['harga', 'price', 'defaultprice']);
    const colUnit = colIndex(['satuan', 'unit']);
    const colBarcode = colIndex(['barcode']);
    const colReorder = colIndex(['reorderpoint', 'reorder_point']);

    if (colName === -1 || colSku === -1 || colPrice === -1) {
      return NextResponse.json(
        {
          error:
            'CSV header must include: nama (or name), sku, harga (or price / defaultprice)',
        },
        { status: 400 },
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 2; // 1-indexed, header is row 1
      const fields = parseCsvLine(dataLines[i]);

      const name = fields[colName] ?? '';
      const sku = fields[colSku] ?? '';

      if (!name || !sku) {
        skipped++;
        continue;
      }

      const rawPrice = fields[colPrice] ?? '';
      const defaultPrice = parseFloat(rawPrice.replace(/[^0-9.-]/g, ''));
      if (isNaN(defaultPrice) || defaultPrice < 0) {
        errors.push(`Row ${rowNum}: invalid price "${rawPrice}"`);
        skipped++;
        continue;
      }

      const unit = (colUnit !== -1 && fields[colUnit]) ? fields[colUnit] : 'pcs';
      const barcode =
        colBarcode !== -1 && fields[colBarcode] ? fields[colBarcode] : null;
      const rawReorder = colReorder !== -1 ? (fields[colReorder] ?? '') : '';
      const reorderPoint = rawReorder ? parseInt(rawReorder, 10) : 0;

      try {
        await prisma.product.upsert({
          where: { tenantId_sku: { tenantId, sku } },
          update: {
            name,
            unit,
            defaultPrice,
            barcode,
            reorderPoint: isNaN(reorderPoint) ? 0 : reorderPoint,
          },
          create: {
            tenantId,
            sku,
            name,
            unit,
            defaultPrice,
            barcode,
            reorderPoint: isNaN(reorderPoint) ? 0 : reorderPoint,
          },
        });
        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Row ${rowNum} (${sku}): ${msg}`);
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error('[POST /api/products/import]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
