.PHONY: help demo docs

help:
	@echo "Available commands:"
	@echo "  make demo  - run the ADP v2 curl demo script"
	@echo "  make docs  - print the docs folder location"
	@echo "  make help  - show this help message"

demo:
	bash examples/adp-v2-demo.sh

docs:
	@echo "Documentation lives in: ./docs"
