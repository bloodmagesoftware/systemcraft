#ifndef EVALUATOR_H
#define EVALUATOR_H

#include "parser.h"

/* Evaluate an AST and return the result */
double evaluate(const ASTNode *node, const char **error);

#endif
