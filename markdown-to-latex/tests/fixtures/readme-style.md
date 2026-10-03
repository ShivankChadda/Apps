<h1 align="center">
  <img src="images/photo.png" alt="Project logo" width="320"><br>
  FastCache
</h1>

<p align="center">
  <a href="https://example.com/ci"><img src="https://img.shields.io/badge/build-passing-brightgreen" alt="build"></a>
  <a href="https://example.com/npm"><img src="https://img.shields.io/npm/v/fastcache" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="license"></a>
</p>

> A tiny, blazing-fast in-memory cache for Node.js and the browser.

[![Build Status](https://example.com/badge.svg)](https://example.com/ci) [![Coverage](https://example.com/cov.svg)](https://example.com/cov)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Basic example](#basic-example)
  - [Options](#options)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install fastcache
# or
yarn add fastcache
```

## Usage

### Basic example

```js
const { Cache } = require('fastcache');

const cache = new Cache({ maxSize: 1000, ttl: 60_000 });
cache.set('answer', 42);
console.log(cache.get('answer')); // 42
```

### Options

| Option    | Type      | Default | Description                                  |
|-----------|-----------|---------|----------------------------------------------|
| `maxSize` | `number`  | `500`   | Maximum number of entries                    |
| `ttl`     | `number`  | `0`     | Time-to-live in ms (`0` = forever)           |
| `onEvict` | `Function`| `null`  | Called as `onEvict(key, value)` on eviction  |

## API

### `cache.get(key)`

Returns the cached value or `undefined`.

### `cache.set(key, value, [ttl])`

Stores `value` under `key`. See [Options](#options) and the [docs](./docs/api.md).

<details>
<summary>Benchmarks (click to expand)</summary>

| Library | ops/sec |
|---------|--------:|
| fastcache | 12,400,000 |
| lru-cache | 3,100,000 |

</details>

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-feature`)
3. Commit your changes
4. Open a pull request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

MIT © 2026 Jane Doe
