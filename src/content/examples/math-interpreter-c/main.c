#include "evaluator.h"
#include "lexer.h"
#include "parser.h"
#include <stdio.h>
#include <string.h>

/*
 * Main entry point
 * Reads a mathematical expression from command line arguments,
 * parses it, evaluates it, and prints the result.
 */
int main(int argc, char *argv[]) {
  /* Check if an expression was provided */
  if (argc != 2) {
    fprintf(stderr, "Usage: %s \"expression\"\n", argv[0]);
    fprintf(stderr, "Example: %s \"2 + 3 * 4\"\n", argv[0]);
    return 1;
  }

  const char *input = argv[1];
  const char *error = NULL;

  /* Step 1: Tokenize (Lexical Analysis) */
  Lexer lexer;
  lexer_init(&lexer, input);

  /* Step 2: Parse (Syntax Analysis) */
  ASTNode *ast = parse(&lexer, &error);
  if (!ast) {
    fprintf(stderr, "Parse error: %s\n", error);
    return 1;
  }

  /* Step 3: Evaluate (Execution) */
  double result = evaluate(ast, &error);
  if (error) {
    fprintf(stderr, "Evaluation error: %s\n", error);
    ast_free(ast);
    return 1;
  }

  /* Print the result */
  printf("%g\n", result);

  /* Clean up */
  ast_free(ast);
  return 0;
}
