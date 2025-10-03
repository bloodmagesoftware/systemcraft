import type { Lexer } from "./lexer.js";
import {
	type ASTNode,
	type BinaryOpNode,
	type Token,
	TokenType,
} from "./types.js";

// The Parser builds an Abstract Syntax Tree (AST) from tokens
// It understands the grammar rules (like operator precedence)
// Example: "2 + 3 * 4" becomes an AST where * is evaluated before +
export class Parser {
	private currentToken: Token;

	constructor(private lexer: Lexer) {
		// Get the first token to start parsing
		this.currentToken = this.lexer.getNextToken();
	}

	// Check if current token matches expected type, then move to next token
	private eat(tokenType: TokenType): void {
		if (this.currentToken.type === tokenType) {
			this.currentToken = this.lexer.getNextToken();
		} else {
			throw new Error(`Expected ${tokenType}, got ${this.currentToken.type}`);
		}
	}

	// Parse a number or a parenthesized expression
	// This is the highest priority (evaluated first)
	private factor(): ASTNode {
		const token = this.currentToken;

		// Handle numbers
		if (token.type === TokenType.NUMBER) {
			this.eat(TokenType.NUMBER);
			return { type: "Number", value: parseFloat(token.value) };
		}

		// Handle parenthesized expressions like (2 + 3)
		if (token.type === TokenType.LEFT_PAREN) {
			this.eat(TokenType.LEFT_PAREN);
			const node = this.expr(); // Parse the expression inside parentheses
			this.eat(TokenType.RIGHT_PAREN);
			return node;
		}

		throw new Error(`Unexpected token: ${token.type}`);
	}

	// Parse multiplication and division (higher precedence than +/-)
	// Example: "2 * 3 / 4" is parsed as (2 * 3) / 4
	private term(): ASTNode {
		let node = this.factor();

		// Keep processing * and / operators at the same level
		while (
			this.currentToken.type === TokenType.MULTIPLY ||
			this.currentToken.type === TokenType.DIVIDE
		) {
			const token = this.currentToken;

			if (token.type === TokenType.MULTIPLY) {
				this.eat(TokenType.MULTIPLY);
				node = {
					type: "BinaryOp",
					operator: "*",
					left: node,
					right: this.factor(),
				} as BinaryOpNode;
			} else if (token.type === TokenType.DIVIDE) {
				this.eat(TokenType.DIVIDE);
				node = {
					type: "BinaryOp",
					operator: "/",
					left: node,
					right: this.factor(),
				} as BinaryOpNode;
			}
		}

		return node;
	}

	// Parse addition and subtraction (lower precedence than */)
	// This is the entry point for parsing an expression
	private expr(): ASTNode {
		let node = this.term();

		// Keep processing + and - operators at the same level
		while (
			this.currentToken.type === TokenType.PLUS ||
			this.currentToken.type === TokenType.MINUS
		) {
			const token = this.currentToken;

			if (token.type === TokenType.PLUS) {
				this.eat(TokenType.PLUS);
				node = {
					type: "BinaryOp",
					operator: "+",
					left: node,
					right: this.term(),
				} as BinaryOpNode;
			} else if (token.type === TokenType.MINUS) {
				this.eat(TokenType.MINUS);
				node = {
					type: "BinaryOp",
					operator: "-",
					left: node,
					right: this.term(),
				} as BinaryOpNode;
			}
		}

		return node;
	}

	// Public method to start parsing
	public parse(): ASTNode {
		const ast = this.expr();
		// Make sure we've consumed all input
		this.eat(TokenType.EOF);
		return ast;
	}
}
