#ifndef ARENA_H
#define ARENA_H

#include <stdbool.h>
#include <stddef.h>

typedef struct Arena {
  unsigned char *memory; // Using unsigned char for byte-level operations
  size_t size;           // Total size of the arena
  size_t offset;         // Current allocation offset
} Arena;

// Initialize an arena with a given buffer
// Why separate init from allocation: Allows users to provide their own memory
// (stack, static, or heap) giving them full control over memory source
Arena arena_init(void *buffer, size_t size);

// Allocate memory from the arena with specified alignment
// Why alignment parameter: Different types need different alignment for
// performance and correctness (e.g., doubles need 8-byte alignment)
void *arena_alloc_aligned(Arena *arena, size_t size, size_t alignment);

// Convenience function for common case (natural alignment)
// Why separate function: Most allocations just need natural alignment,
// making the API simpler for the common case
void *arena_alloc(Arena *arena, size_t size);

// Reset the arena for reuse
// Why reset instead of freeing individual allocations: The whole point
// of arenas is batch deallocation - much faster than tracking individual frees
void arena_reset(Arena *arena);

// Get remaining space in the arena
// Why expose this: Users can make informed decisions about when to reset
// or whether an allocation will fit
size_t arena_space_remaining(const Arena *arena);

#endif // ARENA_H
