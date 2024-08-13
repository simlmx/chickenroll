.PHONY: build
build:
	pnpm run -r build

.PHONY: test
test:
	pnpm run -r test

.PHONY: format
format:
	pnpm prettier ui game --write
	cd game && pnpm eslint . --fix
	cd ui && pnpm eslint . --fix

.PHONY: check-format
check-format:
	pnpm prettier ui game --check
	cd game && pnpm eslint . --quiet
	cd ui && pnpm eslint . --quiet

.PHONY: watch
watch:
	pnpm run --parallel -r watch
