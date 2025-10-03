#include "parser.h"
#include <stdio.h>
#include <stdlib.h>

/* Parser state */
typedef struct {
  Lexer *lexer;
  Token current;
  const char **error;
} Parser;

/* Forward declarations for recursive descent parsing */
static ASTNode *parse_expression(Parser *parser);
static ASTNode *parse_term(Parser *parser);
static ASTNode *parse_factor(Parser *parser);

/* Helper: Move to the next token */
static void advance(Parser *parser) {
  parser->current = lexer_next_token(parser->lexer);
}

/* Helper: Create a number node */
static ASTNode *create_number_node(double value) {
  ASTNode *node = malloc(sizeof(ASTNode));
  if (!node)
    return NULL;

  node->type = NODE_NUMBER;
  node->data.number = value;
  return node;
}

/* Helper: Create a binary operation node */
static ASTNode *create_binary_op_node(TokenType op, ASTNode *left,
                                      ASTNode *right) {
  ASTNode *node = malloc(sizeof(ASTNode));
  if (!node) {
    ast_free(left);
    ast_free(right);
    return NULL;
  }

  node->type = NODE_BINARY_OP;
  node->data.binary_op.operator= op;
  node->data.binary_op.left = left;
  node->data.binary_op.right = right;
  return node;
}

/*
 * Parse an expression (lowest precedence: addition and subtraction)
 * Grammar: expression = term (('+' | '-') term)*
 */
static ASTNode *parse_expression(Parser *parser) {
  ASTNode *node = parse_term(parser);
  if (!node)
    return NULL;

  /* Handle addition and subtraction (left-associative) */
  while (parser->current.type == TOKEN_PLUS ||
         parser->current.type == TOKEN_MINUS) {
    TokenType op = parser->current.type;
    advance(parser);

    ASTNode *right = parse_term(parser);
    if (!right) {
      ast_free(node);
      return NULL;
    }

    node = create_binary_op_node(op, node, right);
    if (!node) {
      *parser->error = "Out of memory";
      return NULL;
    }
  }

  return node;
}

/*
 * Parse a term (higher precedence: multiplication and division)
 * Grammar: term = factor (('*' | '/') factor)*
 */
static ASTNode *parse_term(Parser *parser) {
  ASTNode *node = parse_factor(parser);
  if (!node)
    return NULL;

  /* Handle multiplication and division (left-associative) */
  while (parser->current.type == TOKEN_MULTIPLY ||
         parser->current.type == TOKEN_DIVIDE) {
    TokenType op = parser->current.type;
    advance(parser);

    ASTNode *right = parse_factor(parser);
    if (!right) {
      ast_free(node);
      return NULL;
    }

    node = create_binary_op_node(op, node, right);
    if (!node) {
      *parser->error = "Out of memory";
      return NULL;
    }
  }

  return node;
}

/*
 * Parse a factor (highest precedence: numbers and parentheses)
 * Grammar: factor = NUMBER | '(' expression ')'
 */
static ASTNode *parse_factor(Parser *parser) {
  Token token = parser->current;

  if (token.type == TOKEN_NUMBER) {
    advance(parser);
    return create_number_node(token.value);
  }

  if (token.type == TOKEN_LPAREN) {
    advance(parser); /* Skip '(' */

    ASTNode *node = parse_expression(parser);
    if (!node)
      return NULL;

    if (parser->current.type != TOKEN_RPAREN) {
      ast_free(node);
      *parser->error = "Expected ')'";
      return NULL;
    }

    advance(parser); /* Skip ')' */
    return node;
  }

  *parser->error = "Expected number or '('";
  return NULL;
}

ASTNode *parse(Lexer *lexer, const char **error) {
  Parser parser = {lexer, {TOKEN_ERROR, 0.0}, error};

  advance(&parser);
  ASTNode *ast = parse_expression(&parser);

  if (!ast)
    return NULL;

  /* Ensure we've consumed all input */
  if (parser.current.type != TOKEN_END) {
    ast_free(ast);
    *error = "Unexpected token after expression";
    return NULL;
  }

  return ast;
}

void ast_free(ASTNode *node) {
  if (!node)
    return;

  if (node->type == NODE_BINARY_OP) {
    ast_free(node->data.binary_op.left);
    ast_free(node->data.binary_op.right);
  }

  free(node);
}
