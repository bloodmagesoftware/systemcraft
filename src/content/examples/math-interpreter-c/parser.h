#ifndef PARSER_H
#define PARSER_H

#include "lexer.h"
#include "token.h"

/* AST (Abstract Syntax Tree) node types */
typedef enum {
  NODE_NUMBER,   /* A leaf node containing a number */
  NODE_BINARY_OP /* A node with an operator and two children */
} NodeType;

/* Forward declaration for recursive structure */
typedef struct ASTNode ASTNode;

/* An AST node represents part of the mathematical expression */
struct ASTNode {
  NodeType type;
  union {
    double number; /* Used when type is NODE_NUMBER */
    struct {
      TokenType operator; /* +, -, *, or / */
      ASTNode *left;      /* Left operand */
      ASTNode *right;     /* Right operand */
    } binary_op;
  } data;
};

/* Parse the tokens into an Abstract Syntax Tree */
ASTNode *parse(Lexer *lexer, const char **error);

/* Free the memory used by an AST */
void ast_free(ASTNode *node);

#endif
