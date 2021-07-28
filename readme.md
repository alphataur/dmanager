# dmanager

An extensible download manager written in nodejs.

### Installation

```
npm install
node server.js
```

before running the server make sure to set the value BASE in `.env` file to set download dir

### Developement

Whats Working?

- [x] excellent torrent downloading and resuming support
- [x] youtube-client works for batch and single downloads


Todo:

- [ ] Download/fetch support(pass headers)
- [x] multiprotocol (http/https)
- [x] resume support(partial)
- [ ] connect phoenix with backend with websocket(faster progress delivery)
- [ ] resume support for youtube links
- [x] parallel downloads
- [x] parallel batch downloads
- [x] torrent support(currently on script level{breaking on schema})
- [ ] implement retries in base

Fixmes:

- [ ] Fix single-client offset mechanism
