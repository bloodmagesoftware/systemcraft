#include "lexer.h"
#include <ctype.h>
#include <stdlib.h>

void lexer_init(Lexer *lexer, const char *input) {
  lexer->input = input;
  lexer->position = 0;
}

/* Helper: Skip whitespace characters */
static void skip_whitespace(Lexer *lexer) {
  while (isspace(lexer->input[lexer->position])) {
    lexer->position++;
  }
}

/* Helper: Read a number from the input */
static Token read_number(Lexer *lexer) {
  Token token = {TOKEN_NUMBER, 0.0};

  /* Convert the string to a double using strtod */
  char *end;
  token.value = strtod(&lexer->input[lexer->position], &end);

  /* Move position forward by the number of characters read */
  lexer->position += (end - &lexer->input[lexer->position]);

  return token;
}

Token lexer_next_token(Lexer *lexer) {
  skip_whitespace(lexer);

  char current = lexer->input[lexer->position];

  /* Check for end of input */
  if (current == '\0') {
    return (Token){TOKEN_END, 0.0};
  }

  /* Check if it's a digit or decimal point (start of a number) */
  if (isdigit(current) || current == '.') {
    return read_number(lexer);
  }

  /* Single-character tokens */
  lexer->position++;
  switch (current) {
  case '+':
    return (Token){TOKEN_PLUS, 0.0};
  case '-':
    return (Token){TOKEN_MINUS, 0.0};
  case '*':
    return (Token){TOKEN_MULTIPLY, 0.0};
  case '/':
    return (Token){TOKEN_DIVIDE, 0.0};
  case '(':
    return (Token){TOKEN_LPAREN, 0.0};
  case ')':
    return (Token){TOKEN_RPAREN, 0.0};
  default:
    return (Token){TOKEN_ERROR, 0.0};
  }
}
