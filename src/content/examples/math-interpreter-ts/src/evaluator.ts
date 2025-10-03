import type { ASTNode } from "./types.js";

// The Evaluator walks through the AST and computes the result
// It uses recursion to evaluate nested expressions
export class Evaluator {
	// Recursively evaluate an AST node and return the numeric result
	public evaluate(node: ASTNode): number {
		// Base case: if it's a number, just return its value
		if (node.type === "Number") {
			return node.value;
		}

		// Recursive case: if it's an operation, evaluate both sides first
		if (node.type === "BinaryOp") {
			const left = this.evaluate(node.left);
			const right = this.evaluate(node.right);

			// Then apply the operator
			switch (node.operator) {
				case "+":
					return left + right;
				case "-":
					return left - right;
				case "*":
					return left * right;
				case "/":
					if (right === 0) {
						throw new Error("Division by zero");
					}
					return left / right;
			}
		}

		// This should never happen if our parser is correct
		throw new Error(`Unknown node type`);
	}
}
