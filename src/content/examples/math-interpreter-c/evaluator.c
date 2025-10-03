#include "evaluator.h"

/*
 * Recursively evaluate an AST node
 * For numbers: return the value
 * For operations: evaluate children and apply the operator
 */
double evaluate(const ASTNode *node, const char **error) {
  if (!node) {
    *error = "Invalid AST node";
    return 0.0;
  }

  /* Base case: leaf node with a number */
  if (node->type == NODE_NUMBER) {
    return node->data.number;
  }

  /* Recursive case: binary operation */
  if (node->type == NODE_BINARY_OP) {
    /* Evaluate both operands recursively */
    double left = evaluate(node->data.binary_op.left, error);
    if (*error)
      return 0.0;

    double right = evaluate(node->data.binary_op.right, error);
    if (*error)
      return 0.0;

    /* Apply the operator */
    switch (node->data.binary_op.operator) {
    case TOKEN_PLUS:
      return left + right;
    case TOKEN_MINUS:
      return left - right;
    case TOKEN_MULTIPLY:
      return left * right;
    case TOKEN_DIVIDE:
      if (right == 0.0) {
        *error = "Division by zero";
        return 0.0;
      }
      return left / right;
    default:
      *error = "Invalid operator";
      return 0.0;
    }
  }

  *error = "Unknown node type";
  return 0.0;
}
