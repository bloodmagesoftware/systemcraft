CC = gcc
CFLAGS = -std=c99 -Wall -Wextra -O2

OBJS = arena.o
TARGET = arena_example

.PHONY: all clean

all: $(TARGET)

$(TARGET): main.c $(OBJS)
	$(CC) $(CFLAGS) $^ -o $@

%.o: %.c %.h
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)
