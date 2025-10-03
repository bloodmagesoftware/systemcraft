import { Evaluator } from "./evaluator.js";
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";

// Main function that orchestrates the interpretation process
function main(): void {
	// Get the expression from command line arguments
	// process.argv[0] is 'node', argv[1] is the script path
	// argv[2] is our first actual argument
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error("Usage: node index.js '<expression>'");
		console.error("Example: node index.js '2 + 3 * 4'");
		process.exit(1);
	}

	// Join all arguments in case the expression has spaces
	const input = args.join(" ");

	try {
		// Step 1: Lexical Analysis - break input into tokens
		const lexer = new Lexer(input);

		// Step 2: Parsing - build an Abstract Syntax Tree
		const parser = new Parser(lexer);
		const ast = parser.parse();

		// Step 3: Evaluation - compute the result
		const evaluator = new Evaluator();
		const result = evaluator.evaluate(ast);

		// Output the result to stdout
		console.log(result);
	} catch (error) {
		// Output errors to stderr
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`);
		} else {
			console.error("An unknown error occurred");
		}
		process.exit(1);
	}
}

main();
