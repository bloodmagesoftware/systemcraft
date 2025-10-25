import { useEffect, useRef, useState } from "preact/hooks";
import { isError } from "./helpers";
import { RegexInput } from "./regex-intup";

export interface Props {
	input?: string;
	text?: string;
}

export function Regex(props: Props) {
	const [expression, setExpression] = useState(props.input ?? "");
	const [text, setText] = useState(props.text ?? "");
	const [error, setError] = useState("");
	const [match, setMatch] = useState<RegExpExecArray[]>([]);

	useEffect(() => {
		try {
			const regex = new RegExp(expression || "^$", "gm");
			setMatch(arrayFromRegExpStringIterator(text.matchAll(regex)));
			setError("");
		} catch (e) {
			setMatch([]);
			setError(isError(e) ? e.message : String(e));
		}
	}, [expression, text]);

	return (
		<div class="space-y-4 text-slate-200">
			<label class="flex items-center gap-2">
				<span class="shrink-0">Regex:</span>
				<RegexInput
					value={expression}
					onInput={(e) => setExpression(e.currentTarget.value)}
					class="bg-transparent"
				/>
			</label>

			<label class="block">
				<span class="mb-2 block">Text:</span>
				<HighlightedTextarea
					value={text}
					onChange={setText}
					matches={match}
					ariaLabel="Input text to test against the regex"
				/>
			</label>

			<Output error={error} match={match} />
		</div>
	);
}

interface OutputProps {
	error: string;
	match: RegExpExecArray[];
}

function arrayFromRegExpStringIterator(
	match: RegExpStringIterator<RegExpExecArray>,
) {
	const arr: RegExpExecArray[] = [];
	for (const m of match) arr.push(m);
	return arr;
}

function Output(props: OutputProps) {
	if (props.error) {
		return (
			<div>
				<pre class="rounded-md p-3 bg-red-900/20 text-red-300">
					Error: {props.error}
				</pre>
			</div>
		);
	}

	return (
		<>
			<p class="font-medium">Output:</p>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-2">
				{props.match.map((match, i) => (
					<RenderRegExpExecArray key={i.toString()} match={match} />
				))}
			</div>
		</>
	);
}

interface RenderRegExpExecArrayProps {
	match: RegExpExecArray;
}

function RenderRegExpExecArray(props: RenderRegExpExecArrayProps) {
	if (props.match.length === 0) {
		return <span class="rounded-md border p-2 border-slate-700">Empty</span>;
	}

	return (
		<div class="rounded-md border p-2 border-slate-700">
			<span class="flex flex-row gap-2 overflow-hidden">
				<span class="font-semibold">Full match:</span>
				<span>{props.match[0]}</span>
			</span>
			{props.match.length > 1 && (
				<div class="mt-1 space-y-1">
					<span class="font-semibold">Groups:</span>
					<ol class="list-decimal list-outside overflow-hidden">
						{props.match.slice(1).map((m, i) => (
							<li key={i.toString()} class="rounded bg-gray-900 px-2 py-1">
								{m}
							</li>
						))}
					</ol>
				</div>
			)}
		</div>
	);
}

/* ---------------- Highlighted textarea (overlay) ---------------- */

interface HighlightedTextareaProps {
	value: string;
	onChange: (v: string) => void;
	matches: RegExpExecArray[];
	ariaLabel?: string;
}

/**
 * Overlay renders transparent text with background-only highlights behind the
 * real textarea. The textarea shows the actual text, keeping it sharp/readable.
 */
function HighlightedTextarea(props: HighlightedTextareaProps) {
	const { value, onChange, matches, ariaLabel } = props;
	const taRef = useRef<HTMLTextAreaElement>(null);
	const overlayRef = useRef<HTMLPreElement>(null);
	const [scroll, setScroll] = useState({ top: 0, left: 0 });

	const highlightedHTML = buildHighlightedHTML(value, matches);

	const handleScroll = () => {
		const el = taRef.current;
		if (!el) return;
		setScroll({ top: el.scrollTop, left: el.scrollLeft });
	};

	// Plain-text paste only
	const handlePaste = (e: any) => {
		const el = taRef.current;
		if (!el || !e.clipboardData) return;
		e.preventDefault();
		const txt = e.clipboardData.getData("text/plain") ?? "";
		insertTextAtCursor(el, txt, onChange);
	};

	const handleInput = (e: Event) => {
		onChange((e.currentTarget as HTMLTextAreaElement).value);
	};

	useEffect(() => {
		const overlay = overlayRef.current;
		if (!overlay) return;
		overlay.style.transform = `translate(${-scroll.left}px, ${-scroll.top}px)`;
	}, [scroll]);

	return (
		<div class="relative w-full">
			{/* Overlay: paints highlights only (text is transparent) */}
			<div class="pointer-events-none absolute inset-0 overflow-hidden">
				<pre
					ref={overlayRef}
					aria-hidden="true"
					class="bg-transparent m-0 whitespace-pre-wrap break-words rounded-md border border-transparent px-3 py-2 font-mono text-transparent tab-[-4] leading-6"
					dangerouslySetInnerHTML={{ __html: highlightedHTML }}
				/>
			</div>

			{/* Real editable textarea */}
			<textarea
				ref={taRef}
				value={value}
				aria-label={ariaLabel}
				onInput={handleInput}
				onScroll={handleScroll}
				onPaste={handlePaste}
				spellcheck={false}
				autocomplete="off"
				autocorrect="off"
				autocapitalize="off"
				class="w-full min-h-40 resize-y rounded-md border px-3 py-2 font-mono leading-6 outline-none focus:border-slate-400 focus:ring-2 focus:ring-indigo-500 border-slate-700 bg-slate-900 text-slate-200 selection:bg-indigo-400/30 selection:text-slate-200"
			/>
		</div>
	);
}

/* ---- Highlight builder: wrap full matches with mark background ---- */

function buildHighlightedHTML(
	text: string,
	matches: RegExpExecArray[],
): string {
	if (!text) return "<span></span>";

	const ms = matches
		.filter((m) => m[0]?.length > 0 && typeof m.index === "number")
		.sort((a, b) => a.index! - b.index!);

	let html = "";
	let pos = 0;

	for (const m of ms) {
		const start = m.index!;
		const end = start + m[0].length;
		if (start < pos) continue; // skip overlaps

		html += escapeHtml(text.slice(pos, start));
		// Background-only highlight (text is transparent via parent)
		html +=
			'<mark class="rounded-[2px] bg-yellow-600/75">' +
			escapeHtml(text.slice(start, end)) +
			"</mark>";
		pos = end;
	}

	html += escapeHtml(text.slice(pos));
	if (html.length === 0) html = "<span></span>";
	return html;
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---- Plain-text paste helper ---- */

function insertTextAtCursor(
	el: HTMLTextAreaElement,
	insert: string,
	onChange: (v: string) => void,
) {
	const { selectionStart = el.value.length, selectionEnd = selectionStart } =
		el;
	const next =
		el.value.slice(0, selectionStart) + insert + el.value.slice(selectionEnd);
	onChange(next);
	requestAnimationFrame(() => {
		const caret = selectionStart + insert.length;
		el.selectionStart = caret;
		el.selectionEnd = caret;
	});
}
