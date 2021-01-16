.PHONY: db build serve

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

# Serve the web app. You need to run `make db` in a different window.
serve: build
	CANTSTOP_DB_URI=postgres://postgres:postgres@0.0.0.0:5454/postgres yarn serve

test:
	yarn test
