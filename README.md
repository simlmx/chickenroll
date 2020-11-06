# Webapp for the board game Cant's Stop

Available at [`cantstop.fun`][csf].


## Background

[Can't stop][wiki] is a "push your luck" dice game.


## Development

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


## About

Comments, questions, feature requests, bug reports, etc. all welcome in github issues or at [`info@cantstop.fun`][email].


[csf]: https://cantstop.fun
[wiki]: https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game)
[bgio]: https://boardgame.io/
[email]: mailto:info@cantstop.fun
