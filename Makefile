.PHONY: build
build:
	pnpm run -r build

.PHONY: test
test:
	pnpm run -r test

.PHONY: fix
fix:
	pnpm prettier ui game --write
	cd game && pnpm eslint . --fix
	cd ui && pnpm eslint . --fix

.PHONY: check
check:
	# prettier
	pnpm prettier ui game --check
	# eslint
	cd game && pnpm eslint . --quiet
	cd ui && pnpm eslint . --quiet
	# types
	cd game && pnpm tsc --noEmit --skipLibCheck
	cd ui && pnpm tsc --noEmit --skipLibCheck

.PHONY: watch
watch:
	pnpm run --parallel -r watch

.PHONY: dev
dev:
	cd ui && pnpm dev
