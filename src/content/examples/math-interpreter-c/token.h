#ifndef TOKEN_H
#define TOKEN_H

/* Token types represent the different kinds of symbols in our expression */
typedef enum {
  TOKEN_NUMBER,   /* A numeric value like 42 or 3.14 */
  TOKEN_PLUS,     /* The + operator */
  TOKEN_MINUS,    /* The - operator */
  TOKEN_MULTIPLY, /* The * operator */
  TOKEN_DIVIDE,   /* The / operator */
  TOKEN_LPAREN,   /* Left parenthesis ( */
  TOKEN_RPAREN,   /* Right parenthesis ) */
  TOKEN_END,      /* Marks the end of input */
  TOKEN_ERROR     /* Indicates an invalid token */
} TokenType;

/* A Token is a categorized piece of the input string */
typedef struct {
  TokenType type;
  double value; /* Only used when type is TOKEN_NUMBER */
} Token;

#endif
