import mathInterpreterC from "./math-interpreter-c?zip";
import mathInterpreterTS from "./math-interpreter-ts?zip";

export type Example = {
	path: string;
	title: string;
};

export const examples = {
	"math-interpreter-c": {
		path: mathInterpreterC,
		title: "Math interpreter in C",
	},
	"math-interpreter-ts": {
		path: mathInterpreterTS,
		title: "Math interpreter in TypeScript",
	},
} as Record<string, Example>;
