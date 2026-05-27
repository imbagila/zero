.PHONY: run install

run:
	go run .

test:
	clear && go run . test

install:
	go install .
