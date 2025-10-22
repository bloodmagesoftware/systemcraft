#include "arena.h"
#include <stdint.h>
#include <string.h>

// Why use macros for alignment: Compile-time computation is faster and
// these operations are used frequently in the allocator
#define ALIGN_UP(ptr, align) (((uintptr_t)(ptr) + (align) - 1) & ~((align) - 1))

#define IS_POWER_OF_TWO(x) ((x) != 0 && ((x) & ((x) - 1)) == 0)

// Why default alignment matches pointer size: This ensures all allocations
// can safely store pointers, which is the most common alignment requirement
#define DEFAULT_ALIGNMENT (sizeof(void *))

Arena arena_init(void *buffer, size_t size) {
  Arena arena;
  arena.memory = (unsigned char *)buffer;
  arena.size = size;
  arena.offset = 0;

  // Why not zero the memory here: The user might have already initialized
  // it, or might not care about zero-initialization (performance)
  return arena;
}

void *arena_alloc_aligned(Arena *arena, size_t size, size_t alignment) {
  // Why these checks: Catching errors early in development is better
  // than mysterious crashes in production
  if (arena == NULL || arena->memory == NULL) {
    return NULL;
  }

  // Why require power-of-two alignment: Hardware alignment requirements
  // are always powers of two, and the bit manipulation is much faster
  if (!IS_POWER_OF_TWO(alignment)) {
    return NULL;
  }

  // Why calculate aligned address: Memory alignment improves performance
  // and is required for some CPU instructions
  uintptr_t current_ptr = (uintptr_t)(arena->memory + arena->offset);
  uintptr_t aligned_ptr = ALIGN_UP(current_ptr, alignment);
  size_t alignment_padding = aligned_ptr - current_ptr;

  // Why check for overflow: Adding sizes could wrap around on 32-bit systems
  // causing us to return a valid pointer but corrupt memory
  size_t total_size = alignment_padding + size;
  if (total_size < size) { // Overflow check
    return NULL;
  }

  size_t new_offset = arena->offset + total_size;
  if (new_offset > arena->size) {
    // Why return NULL instead of asserting: Library code should let
    // the caller decide how to handle allocation failures
    return NULL;
  }

  void *result = (void *)aligned_ptr;
  arena->offset = new_offset;

  // Why not zero the memory: The caller knows better whether they need
  // zeroed memory - they can memset if needed, avoiding cost when not needed
  return result;
}

void *arena_alloc(Arena *arena, size_t size) {
  // Why use DEFAULT_ALIGNMENT: Ensures all allocations can hold any
  // basic type safely, preventing alignment issues
  return arena_alloc_aligned(arena, size, DEFAULT_ALIGNMENT);
}

void arena_reset(Arena *arena) {
  if (arena == NULL) {
    return;
  }

  // Why just reset offset instead of clearing memory: Clearing would be
  // wasteful if the next allocation will overwrite it anyway
  arena->offset = 0;

  // Why not have a separate "clear" function that zeroes: If users need
  // zeroed memory, they should explicitly request it (performance by default)
}

size_t arena_space_remaining(const Arena *arena) {
  if (arena == NULL || arena->offset > arena->size) {
    return 0;
  }
  return arena->size - arena->offset;
}
