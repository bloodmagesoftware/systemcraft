// Types shared across the interpreter

// Token types represent the different elements we can find in an expression
export enum TokenType {
	NUMBER = "NUMBER", // e.g., 42, 3.14
	PLUS = "PLUS", // +
	MINUS = "MINUS", // -
	MULTIPLY = "MULTIPLY", // *
	DIVIDE = "DIVIDE", // /
	LEFT_PAREN = "LEFT_PAREN", // (
	RIGHT_PAREN = "RIGHT_PAREN", // )
	EOF = "EOF", // End of input
}

// A token is a meaningful unit in our expression
// Example: in "2 + 3", we have three tokens: NUMBER(2), PLUS, NUMBER(3)
export interface Token {
	type: TokenType;
	value: string; // The actual text from the input
}

// Abstract Syntax Tree (AST) nodes represent the structure of our expression
// We use different node types for different operations

export interface NumberNode {
	type: "Number";
	value: number;
}

export interface BinaryOpNode {
	type: "BinaryOp";
	operator: "+" | "-" | "*" | "/";
	left: ASTNode; // Left side of the operation
	right: ASTNode; // Right side of the operation
}

// Union type: an AST node can be either a number or an operation
export type ASTNode = NumberNode | BinaryOpNode;
