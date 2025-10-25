import type { InputEventHandler } from "preact";
import { useEffect, useMemo, useRef } from "preact/hooks";
import { twMerge } from "tailwind-merge";

type TokenType =
	| "delim"
	| "flag"
	| "flagBad"
	| "escape"
	| "prop"
	| "classOpen"
	| "classClose"
	| "classNegate"
	| "classChar"
	| "rangeDash"
	| "groupOpen"
	| "groupClose"
	| "groupKind"
	| "groupName"
	| "quant"
	| "quantMod"
	| "anchor"
	| "alternation"
	| "dot"
	| "literal"
	| "error";

interface Token {
	t: TokenType;
	s: string;
}

export interface RegexInputProps {
	value: string;
	onInput: InputEventHandler<HTMLInputElement>;
	className?: string;
}

/**
 * Single-line regex editor with syntax highlighting using Tailwind (dark mode).
 * Props:
 * - value: string (controlled value)
 * - onInput: (value: string) => void
 * - class: Tailwind class names applied to the wrapper
 */
export function RegexInput(props: RegexInputProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const mirrorRef = useRef<HTMLDivElement | null>(null);

	// Tokenize once per value
	const tokens = useMemo(() => tokenizeRegex(props.value), [props.value]);

	// Sync horizontal scroll of mirror with input
	useEffect(() => {
		const input = inputRef.current;
		const mirror = mirrorRef.current;
		if (!input || !mirror) return;

		const sync = () => {
			mirror.style.transform = `translateX(${-input.scrollLeft}px)`;
		};

		input.addEventListener("scroll", sync);
		input.addEventListener("input", sync);
		// Initial sync and on value change
		sync();

		return () => {
			input.removeEventListener("scroll", sync);
			input.removeEventListener("input", sync);
		};
	}, [props.value]);

	return (
		<div
			className={twMerge("relative w-full font-mono text-sm", props.className)}
		>
			{/* Mirror layer (highlighted) */}
			<div
				ref={mirrorRef}
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre rounded-md px-3 py-2"
			>
				<Highlighted tokens={tokens} />
			</div>

			{/* Actual input (transparent text, visible caret) */}
			<input
				ref={inputRef}
				type="text"
				value={props.value}
				onInput={props.onInput}
				spellcheck={false}
				autoCapitalize="off"
				autoComplete="off"
				autoCorrect="off"
				className="relative z-10 w-full rounded-md border border-slate-700 bg-transparent px-3 py-2 text-transparent caret-white outline-none focus:ring-1 focus:ring-slate-500"
			/>
		</div>
	);
}

/* ---------- Highlighter rendering (Tailwind colors) ---------- */

function Highlighted({ tokens }: { tokens: Token[] }) {
	return (
		<span>
			{tokens.map((tok, i) => (
				<span key={i} className={colorClass(tok.t)}>
					{tok.s}
				</span>
			))}
		</span>
	);
}

function colorClass(t: TokenType): string {
	switch (t) {
		case "delim":
			return "text-slate-500";
		case "flag":
			return "text-fuchsia-400";
		case "flagBad":
			return "text-red-400 underline decoration-red-500/60";
		case "escape":
			return "text-sky-400";
		case "prop":
			return "text-indigo-400";
		case "classOpen":
		case "classClose":
		case "classNegate":
			return "text-emerald-400";
		case "classChar":
			return "text-slate-200";
		case "rangeDash":
			return "text-emerald-400";
		case "groupOpen":
		case "groupClose":
			return "text-purple-400";
		case "groupKind":
			return "text-purple-300";
		case "groupName":
			return "text-purple-200";
		case "quant":
			return "text-amber-400";
		case "quantMod":
			return "text-amber-300";
		case "anchor":
			return "text-rose-400";
		case "alternation":
			return "text-orange-400";
		case "dot":
			return "text-cyan-400";
		case "literal":
			return "text-slate-200";
		case "error":
			return "text-red-500 underline decoration-red-500/60";
		default:
			return "text-slate-200";
	}
}

/* ---------- Regex tokenizer (single-line) ---------- */

function tokenizeRegex(input: string): Token[] {
	const out: Token[] = [];

	// Support both /pattern/flags and bare pattern
	if (input.startsWith("/")) {
		const end = lastUnescapedSlash(input);
		if (end > 0) {
			out.push({ t: "delim", s: "/" });
			const pattern = input.slice(1, end);
			out.push(...lexPattern(pattern));

			out.push({ t: "delim", s: "/" });
			const flags = input.slice(end + 1);
			out.push(...lexFlags(flags));
			return out;
		}
	}

	// Bare pattern
	out.push(...lexPattern(input));
	return out;
}

function lastUnescapedSlash(s: string): number {
	for (let i = s.length - 1; i > 0; i--) {
		if (s[i] === "/" && !isEscaped(s, i)) return i;
	}
	return -1;
}

function isEscaped(s: string, i: number): boolean {
	let b = 0;
	for (let k = i - 1; k >= 0 && s[k] === "\\"; k--) b++;
	return b % 2 === 1;
}

function lexFlags(flags: string): Token[] {
	const out: Token[] = [];
	const seen = new Set<string>();
	// JS + proposals (as of 2025): d g i m s u y v
	const valid = new Set(["d", "g", "i", "m", "s", "u", "y", "v"]);
	for (const ch of flags) {
		if (!/[a-z]/i.test(ch) || seen.has(ch) || !valid.has(ch)) {
			out.push({ t: "flagBad", s: ch });
		} else {
			out.push({ t: "flag", s: ch });
			seen.add(ch);
		}
	}
	return out;
}

function lexPattern(src: string): Token[] {
	const out: Token[] = [];
	let i = 0;
	let inClass = false;
	let classCount = 0; // chars seen since '['
	let groupDepth = 0;

	const push = (t: TokenType, s: string) => out.push({ t, s });

	while (i < src.length) {
		const ch = src[i];

		if (!inClass) {
			// Escapes (outside class)
			if (ch === "\\") {
				const { text, kind, next } = readEscape(src, i);
				push(kind, text);
				i = next;
				continue;
			}

			// Character class open/close
			if (ch === "[") {
				inClass = true;
				classCount = 0;
				push("classOpen", "[");
				i++;
				continue;
			}
			if (ch === "]") {
				// Unmatched close
				push("error", "]");
				i++;
				continue;
			}

			// Groups
			if (ch === "(") {
				groupDepth++;
				push("groupOpen", "(");
				i++;
				if (src[i] === "?") {
					// Group prefixes
					const start = i;
					// 3-char prefixes first (?<=, ?<!)
					const three = src.slice(i, i + 3);
					if (three === "?<=" || three === "?<!") {
						push("groupKind", three);
						i += 3;
					} else {
						const two = src.slice(i, i + 2);
						if (two === "?:" || two === "?=" || two === "?!" || two === "?>") {
							push("groupKind", two);
							i += 2;
						} else if (src[i] === "?") {
							// Named group ?<name>
							if (src[i + 1] === "<") {
								const end = src.indexOf(">", i + 2);
								if (end !== -1) {
									push("groupKind", "?<");
									const name = src.slice(i + 2, end);
									push("groupName", name);
									push("groupKind", ">");
									i = end + 1;
								} else {
									// Malformed name
									push("error", src.slice(i));
									i = src.length;
								}
							} else {
								// Unknown ?-modifier: mark '?' as kind
								push("groupKind", "?");
								i++;
							}
						}
					}
					// If nothing consumed beyond '?', avoid infinite loop
					if (i === start) {
						push("groupKind", "?");
						i++;
					}
				}
				continue;
			}
			if (ch === ")") {
				if (groupDepth > 0) {
					groupDepth--;
					push("groupClose", ")");
				} else {
					push("error", ")");
				}
				i++;
				continue;
			}

			// Quantifiers
			if (ch === "{" && looksLikeQuantifier(src, i)) {
				const { text, end } = readBraceQuant(src, i);
				push("quant", text);
				i = end;
				// Lazy/possessive modifier
				if (src[i] === "?" || src[i] === "+") {
					push("quantMod", src[i]);
					i++;
				}
				continue;
			}
			if (ch === "*" || ch === "+") {
				let q = ch;
				i++;
				if (src[i] === "?" || src[i] === "+") {
					q += src[i];
					push("quant", q[0]);
					push("quantMod", q[1]);
					i++;
				} else {
					push("quant", q);
				}
				continue;
			}
			if (ch === "?") {
				// treat as quantifier outside class
				i++;
				if (src[i] === "?") {
					push("quant", "?");
					push("quantMod", "?");
					i++;
				} else if (src[i] === "+") {
					push("quant", "?");
					push("quantMod", "+");
					i++;
				} else {
					push("quant", "?");
				}
				continue;
			}

			// Anchors, alternation, dot
			if (ch === "^" || ch === "$") {
				push("anchor", ch);
				i++;
				continue;
			}
			if (ch === "|") {
				push("alternation", ch);
				i++;
				continue;
			}
			if (ch === ".") {
				push("dot", ch);
				i++;
				continue;
			}

			// Literal
			push("literal", ch);
			i++;
			continue;
		} else {
			// Inside character class
			if (ch === "\\") {
				const { text, kind, next } = readEscape(src, i);
				push(kind, text);
				i = next;
				classCount++;
				continue;
			}
			if (classCount === 0 && ch === "^") {
				push("classNegate", "^");
				i++;
				classCount++;
				continue;
			}
			if (ch === "]") {
				if (classCount === 0) {
					// ']' as literal when first char
					push("classChar", "]");
					i++;
					classCount++;
				} else {
					inClass = false;
					push("classClose", "]");
					i++;
				}
				continue;
			}
			if (ch === "-") {
				push("rangeDash", "-");
				i++;
				classCount++;
				continue;
			}

			// Regular class char
			push("classChar", ch);
			i++;
			classCount++;
			continue;
		}
	}

	// Note: unmatched '[' or '(' are not post-marked; closing errors handled.
	return out;
}

function readEscape(
	s: string,
	i: number,
): { text: string; kind: TokenType; next: number } {
	// s[i] is '\'
	const ch = s[i + 1] ?? "";
	// Unicode property \p{...} or \P{...}
	if ((ch === "p" || ch === "P") && s[i + 2] === "{") {
		const end = s.indexOf("}", i + 3);
		if (end !== -1) {
			return {
				text: s.slice(i, end + 1),
				kind: "prop",
				next: end + 1,
			};
		}
		return {
			text: s.slice(i),
			kind: "error",
			next: s.length,
		};
	}
	// \u{...}
	if (ch === "u" && s[i + 2] === "{") {
		const end = s.indexOf("}", i + 3);
		if (end !== -1) {
			return {
				text: s.slice(i, end + 1),
				kind: "escape",
				next: end + 1,
			};
		}
		return { text: s.slice(i), kind: "error", next: s.length };
	}
	// \uHHHH
	if (ch === "u" && /^[0-9A-Fa-f]{4}/.test(s.slice(i + 2, i + 6))) {
		return {
			text: s.slice(i, i + 6),
			kind: "escape",
			next: i + 6,
		};
	}
	// \xHH
	if (ch === "x" && /^[0-9A-Fa-f]{2}/.test(s.slice(i + 2, i + 4))) {
		return {
			text: s.slice(i, i + 4),
			kind: "escape",
			next: i + 4,
		};
	}
	// Backreference \k<name>
	if (ch === "k" && s[i + 2] === "<") {
		const end = s.indexOf(">", i + 3);
		if (end !== -1) {
			return {
				text: s.slice(i, end + 1),
				kind: "escape",
				next: end + 1,
			};
		}
		return { text: s.slice(i), kind: "error", next: s.length };
	}
	// Simple escape \. \d \w \n etc. or stray backslash
	if (ch) {
		return { text: s.slice(i, i + 2), kind: "escape", next: i + 2 };
	}
	// Trailing backslash is an error
	return { text: "\\", kind: "error", next: i + 1 };
}

function looksLikeQuantifier(s: string, i: number): boolean {
	// {n}, {n,}, {n,m} where n,m are 0..many digits
	let j = i + 1;
	let d1 = 0;
	while (/[0-9]/.test(s[j])) {
		j++;
		d1++;
	}
	if (d1 === 0) return false;
	if (s[j] === "}") return true;
	if (s[j] !== ",") return false;
	j++;
	while (/[0-9]/.test(s[j])) j++;
	return s[j] === "}";
}

function readBraceQuant(s: string, i: number): { text: string; end: number } {
	let j = i + 1;
	while (/[0-9]/.test(s[j])) j++;
	if (s[j] === ",") {
		j++;
		while (/[0-9]/.test(s[j])) j++;
	}
	// s[j] should be '}'
	if (s[j] === "}") {
		return { text: s.slice(i, j + 1), end: j + 1 };
	}
	// Fallback (should not happen if guarded)
	return { text: "{", end: i + 1 };
}
