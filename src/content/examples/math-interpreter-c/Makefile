CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -pedantic -O2
TARGET = calc
OBJS = main.o lexer.o parser.o evaluator.o

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $(TARGET) $(OBJS)

main.o: main.c lexer.h parser.h evaluator.h
	$(CC) $(CFLAGS) -c main.c

lexer.o: lexer.c lexer.h token.h
	$(CC) $(CFLAGS) -c lexer.c

parser.o: parser.c parser.h lexer.h token.h
	$(CC) $(CFLAGS) -c parser.c

evaluator.o: evaluator.c evaluator.h parser.h
	$(CC) $(CFLAGS) -c evaluator.c

clean:
	rm -f $(OBJS) $(TARGET)

.PHONY: all clean
