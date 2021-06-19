# dmanager

An extensible download manager written in nodejs.

### Installation

```
npm install
node server.js
```

before running the server make sure to set the value BASE in `.env` file to set download dir

### Developement

Todo:

- [x] Download/fetch support(pass headers)
- [x] multiprotocol (http/https)
- [x] resume support
- [ ] connect phoenix with backend with websocket(faster progress delivery)
- [ ] resume support for youtube links
- [x] parallel downloads
- [ ] parallel batch downloads
- [ ] torrent support(currently on script level{breaking on schema})
- [ ] implement retries in base
