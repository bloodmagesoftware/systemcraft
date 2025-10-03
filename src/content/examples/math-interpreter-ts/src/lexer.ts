import { type Token, TokenType } from "./types.js";

// The Lexer breaks input text into tokens (lexical analysis)
// Example: "2 + 3" becomes [NUMBER(2), PLUS, NUMBER(3), EOF]
export class Lexer {
	private position = 0; // Current position in the input string
	private currentChar: string | null; // Character we're currently looking at

	constructor(private input: string) {
		this.currentChar = input.length > 0 ? (input[0] ?? null) : null;
	}

	// Move to the next character in the input
	private advance(): void {
		this.position++;
		this.currentChar =
			this.position < this.input.length
				? (this.input[this.position] ?? null)
				: null;
	}

	// Skip over whitespace characters (spaces, tabs, newlines)
	private skipWhitespace(): void {
		while (this.currentChar !== null && /\s/.test(this.currentChar)) {
			this.advance();
		}
	}

	// Read a complete number (handles multi-digit and decimal numbers)
	// Example: "123.45" is read as one NUMBER token
	private readNumber(): string {
		let result = "";

		// Keep reading digits and decimal points
		while (this.currentChar !== null && /[0-9.]/.test(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}

		return result;
	}

	// Get the next token from the input
	// This is the main method called by the parser
	public getNextToken(): Token {
		while (this.currentChar !== null) {
			// Skip any whitespace
			if (/\s/.test(this.currentChar)) {
				this.skipWhitespace();
				continue;
			}

			// Check if current character is a digit
			if (/[0-9]/.test(this.currentChar)) {
				return { type: TokenType.NUMBER, value: this.readNumber() };
			}

			// Check for operators and parentheses
			switch (this.currentChar) {
				case "+":
					this.advance();
					return { type: TokenType.PLUS, value: "+" };
				case "-":
					this.advance();
					return { type: TokenType.MINUS, value: "-" };
				case "*":
					this.advance();
					return { type: TokenType.MULTIPLY, value: "*" };
				case "/":
					this.advance();
					return { type: TokenType.DIVIDE, value: "/" };
				case "(":
					this.advance();
					return { type: TokenType.LEFT_PAREN, value: "(" };
				case ")":
					this.advance();
					return { type: TokenType.RIGHT_PAREN, value: ")" };
			}

			// If we reach here, we found an unexpected character
			throw new Error(`Unexpected character: ${this.currentChar}`);
		}

		// We've reached the end of the input
		return { type: TokenType.EOF, value: "" };
	}
}
