# Development

### Start a server *and* the client
```
yarn build && yarn serve
```

### Start a client without a server
```
yarn start
```


## Production

If the environment variable `CANTSTOP_DB_URI` is set, will use a postgresql backend.
Otherwise we'll use [`https://boardgame.io/`'][bgio]s default.


[bgio]: https://boardgame.io/
