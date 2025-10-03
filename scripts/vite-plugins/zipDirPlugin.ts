import archiver from "archiver";
import fsp from "fs/promises";
import path from "path";
import { PassThrough } from "stream";
import type { Plugin } from "vite";

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const bufs: Buffer[] = [];
		stream.on("data", (b) => bufs.push(Buffer.from(b)));
		stream.on("end", () => resolve(Buffer.concat(bufs)));
		stream.on("error", (err) => reject(err));
	});
}

/**
 * zipDirPlugin options:
 * - root: base path to resolve example directories (default: 'source/content/examples')
 * - query: query used in imports (default: 'zip')
 */
export default function zipDirPlugin(
	opts: {
		root?: string;
		query?: string;
	} = {},
): Plugin {
	const root = path.resolve(
		process.cwd(),
		opts.root ?? "source/content/examples",
	);
	const queryKey = opts.query ?? "zip";
	const q = `?${queryKey}`;

	return {
		name: "vite:zip-dir",
		async resolveId(id, importer) {
			if (!id.includes(q)) return null;

			const withoutQuery = id.replace(q, "");
			// try resolving relative to importer, then relative to configured root
			const candidates = [
				importer ? path.resolve(path.dirname(importer), withoutQuery) : null,
				path.resolve(process.cwd(), withoutQuery),
				path.resolve(root, withoutQuery),
			].filter(Boolean) as string[];

			for (const candidate of candidates) {
				try {
					const st = await fsp.stat(candidate);
					if (st.isDirectory()) return candidate + q;
				} catch {
					// continue
				}
			}
			return null;
		},

		async load(id) {
			if (!id.endsWith(q)) return null;
			const dirPath = id.slice(0, -q.length);

			// create archive stream -> buffer
			const archive = archiver("zip", { zlib: { level: 9 } });
			const pass = new PassThrough();
			archive.pipe(pass);
			archive.directory(dirPath, false);
			const bufferPromise = streamToBuffer(pass);
			await archive.finalize();
			const buffer = await bufferPromise;

			const baseName = path.basename(dirPath) || "archive";
			const fileName = `${baseName}.zip`;

			if (process.env.NODE_ENV === "development") {
				// dev: write to cache folder and serve via Vite /@fs/
				const cacheDir = path.resolve(
					process.cwd(),
					"node_modules/.cache/astro-zip",
				);
				await fsp.mkdir(cacheDir, { recursive: true });
				const outPath = path.join(cacheDir, fileName);
				await fsp.writeFile(outPath, buffer);
				const url = `/@fs/${outPath}`;
				return `export default ${JSON.stringify(url)};`;
			} else {
				// build: emit as asset and use __VITE_ASSET__ placeholder
				// @ts-ignore
				const ref = this.emitFile({
					type: "asset",
					name: fileName,
					source: buffer,
				});
				return `export default "__VITE_ASSET__${ref}__";`;
			}
		},
	};
}
