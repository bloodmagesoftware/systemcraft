#ifndef LEXER_H
#define LEXER_H

#include "token.h"

/* The Lexer reads the input string and breaks it into tokens */
typedef struct {
  const char *input; /* The string we're reading from */
  int position;      /* Current position in the string */
} Lexer;

/* Initialize a lexer with the input string */
void lexer_init(Lexer *lexer, const char *input);

/* Get the next token from the input */
Token lexer_next_token(Lexer *lexer);

#endif
