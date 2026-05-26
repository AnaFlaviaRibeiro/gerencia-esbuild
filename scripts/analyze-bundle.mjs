import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = `${__dirname}/..`;
const outdir = `${root}/dist`;
const docsdir = `${root}/docs`;

async function main() {
  try {
    await mkdir(docsdir, { recursive: true });
    const metaPath = `${outdir}/metafile.json`;
    const metaRaw = await readFile(metaPath, 'utf8');
    const meta = JSON.parse(metaRaw);
    const outputs = meta.outputs || {};

    const files = Object.keys(outputs).map((file) => {
      const info = outputs[file];
      return { file, bytes: info.bytes };
    });

    const total = files.reduce((s, f) => s + (f.bytes || 0), 0);
    const report = {
      generatedAt: new Date().toISOString(),
      totalBytes: total,
      files,
    };

    await writeFile(`${outdir}/build-report.json`, JSON.stringify(report, null, 2));

    const mdLines = [
      `# Build Report`,
      `\nGenerated: ${report.generatedAt}`,
      `\n**Total size:** ${(report.totalBytes / 1024).toFixed(2)} KB`,
      `\n## Files`,
    ];

    for (const f of files) {
      mdLines.push(`- ${f.file} — ${(f.bytes / 1024).toFixed(2)} KB`);
    }

    await writeFile(`${docsdir}/BUILD_REPORT.md`, mdLines.join('\n'));
    console.log('Build report written to', `${docsdir}/BUILD_REPORT.md`);
  } catch (err) {
    console.error('Failed to analyze bundle:', err.message || err);
    process.exitCode = 2;
  }
}

main();
