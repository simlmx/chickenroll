# Development

### Installing dependencies
```
make install
```

### Start a client without a server
```
make start
```

### Start a server *and* the client
```
make build
make serve
```



## Production

If the environment variable `CANTSTOP_DB_URI` is set, will use a postgresql backend.
Otherwise we'll use [`https://boardgame.io/`'][bgio]s default.


[bgio]: https://boardgame.io/
