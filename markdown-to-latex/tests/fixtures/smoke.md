---
title: "A *Smoke* Test: Markdown & LaTeX"
subtitle: Everything the converter has to handle
author: Jane Doe; John Roe
date: 2026-01-15
abstract: |
  This document exercises headings, lists, **tables**, code, math, footnotes[^note] and more.
---

# Introduction

This is a paragraph with *emphasis*, **strong text**, ***both***, `inline code`, ~~strikethrough~~, and a
[link](https://example.com/a_b?x=1&y=2#frag "Title") plus an autolink <https://example.org/path_one>.
Quotes: "double" and 'single', it's, rock 'n' roll, a --- dash, an -- en dash... and an ellipsis.

Special characters: 50% of $5 & #hashtag_name ~tilde ^caret {braces} back\\slash.

## Lists

- Item one
- Item two
  - Nested a
  - Nested b
    1. Deep ordered
    2. Second
- [ ] open task
- [x] done task
- [bracket] looks like an optional argument

1. First
2. Second
3. Third

5. Starts at five

## Table

| Name | Qty | Notes |
|:-----|----:|:-----:|
| Apples | 3 | fresh |
| Bananas | 12 | a considerably longer note that has to wrap inside its column nicely |

## Code

```python
def greet(name):
    print(f"Hello, {name}!")  # a comment
```

```
├── src/
│   └── main.py
└── README.md
```

> A quote with **bold**.
>
> - and a list inside

> [!NOTE]
> Alerts are supported.

---

## Math

Inline $E = mc^2$ and $a_1 + b_2$, money $5 and $10 stay text.

$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$

## Unicode

Arrows → ← ⇒, symbols ≤ ≥ ≠ ≈ ∞ ✓ ✗ ★, Greek α β γ, emoji 🚀 🎉, accents café naïve Zürich.

Footnote here.[^note] And another[^two].

[^note]: This is the first footnote with `code`.
[^two]: Second footnote
    continues on a second line.
