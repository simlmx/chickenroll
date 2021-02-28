.PHONY: db build serve start test format

# Start the database
db:
	docker run \
		-it --rm \
		--name cantstop-db \
		-e POSTGRES_PASSWORD=postgres \
		-p 5454:5432 \
		postgres

# Debugging options
# --cpus 0.02 \

# Build the web app
build:
	yarn build

start:
	yarn start

# Serve the web app. You need to run `make db` in a different window.
serve: build
	SKIP_SSLIFY=true CANTSTOP_DB_URI=postgres://postgres:postgres@0.0.0.0:5454/postgres yarn serve

test:
	yarn test

format:
	yarn format
