#include "arena.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Example: Building a simple expression tree using arena allocation
typedef struct ExprNode {
  enum { EXPR_NUMBER, EXPR_ADD, EXPR_MULTIPLY } type;
  union {
    double number;
    struct {
      struct ExprNode *left;
      struct ExprNode *right;
    } binary;
  } data;
} ExprNode;

// Why use arena for tree building: Trees create many small allocations
// that are all freed together - perfect for arena allocation
ExprNode *make_number(Arena *arena, double value) {
  ExprNode *node = arena_alloc(arena, sizeof(ExprNode));
  if (node == NULL)
    return NULL;

  node->type = EXPR_NUMBER;
  node->data.number = value;
  return node;
}

ExprNode *make_binary_op(Arena *arena, int type, ExprNode *left,
                         ExprNode *right) {
  ExprNode *node = arena_alloc(arena, sizeof(ExprNode));
  if (node == NULL)
    return NULL;

  node->type = type;
  node->data.binary.left = left;
  node->data.binary.right = right;
  return node;
}

double evaluate(ExprNode *node) {
  if (node == NULL)
    return 0.0;

  switch (node->type) {
  case EXPR_NUMBER:
    return node->data.number;
  case EXPR_ADD:
    return evaluate(node->data.binary.left) + evaluate(node->data.binary.right);
  case EXPR_MULTIPLY:
    return evaluate(node->data.binary.left) * evaluate(node->data.binary.right);
  default:
    return 0.0;
  }
}

int main(void) {
  // Why stack allocation for small arenas: No malloc overhead, automatic
  // cleanup, and better cache locality for temporary computations
  unsigned char stack_buffer[4096];
  Arena arena = arena_init(stack_buffer, sizeof(stack_buffer));

  printf("Arena initialized with %zu bytes\n", arena.size);

  // Build expression: (2 + 3) * (4 + 5)
  ExprNode *two = make_number(&arena, 2.0);
  ExprNode *three = make_number(&arena, 3.0);
  ExprNode *four = make_number(&arena, 4.0);
  ExprNode *five = make_number(&arena, 5.0);

  ExprNode *add1 = make_binary_op(&arena, EXPR_ADD, two, three);
  ExprNode *add2 = make_binary_op(&arena, EXPR_ADD, four, five);
  ExprNode *multiply = make_binary_op(&arena, EXPR_MULTIPLY, add1, add2);

  printf("Result: %.2f\n", evaluate(multiply));
  printf("Space used: %zu bytes\n", arena.offset);
  printf("Space remaining: %zu bytes\n", arena_space_remaining(&arena));

  // Why arena shines: Reset and reuse for next computation
  arena_reset(&arena);
  printf("\nAfter reset, space remaining: %zu bytes\n",
         arena_space_remaining(&arena));

  // Example with heap memory for larger arenas
  size_t large_size = 1024 * 1024; // 1MB
  void *heap_buffer = malloc(large_size);
  if (heap_buffer != NULL) {
    Arena large_arena = arena_init(heap_buffer, large_size);

    // Why useful for string building: Avoids realloc overhead
    char *string1 = arena_alloc(&large_arena, 100);
    strcpy(string1, "Hello, ");

    char *string2 = arena_alloc(&large_arena, 100);
    strcpy(string2, "Arena Allocator!");

    printf("\n%s%s\n", string1, string2);

    // Why single free is efficient: One deallocation instead of
    // tracking and freeing each allocation
    free(heap_buffer);
  }

  return 0;
}
