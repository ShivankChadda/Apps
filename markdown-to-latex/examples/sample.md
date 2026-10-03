---
title: Study Notes on Binary Search
subtitle: A short, complete example for the Markdown to LaTeX converter
author: Ada Student
date: 2026-10-03
abstract: |
  These notes explain binary search, show a reference implementation and compare it with
  linear search. They also demonstrate what the converter understands: headings, lists,
  tables, code, math, footnotes, quotes and links.
---

# Introduction

Binary search finds an item in a **sorted** array by repeatedly halving the range that
could contain it. It is one of the first algorithms every programmer should know,[^knuth]
and it is a good example of how a small idea can change the running time from linear to
logarithmic.

> [!TIP]
> Binary search only works when the data is sorted. Sorting first costs $O(n \log n)$,
> so it pays off when you search many times.

## How it works

1. Look at the middle element.
2. If it equals the target, you are done.
3. If the target is smaller, continue in the left half; otherwise continue in the right half.
4. Stop when the range is empty: the target is not present.

At every step the number of candidates is cut in half, so after $k$ steps at most
$n / 2^k$ candidates remain. Solving $n / 2^k = 1$ gives

$$
k = \log_2 n .
$$

## Implementation

```python
def binary_search(items, target):
    low, high = 0, len(items) - 1
    while low <= high:
        mid = (low + high) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1   # not found
```

A few details that are easy to get wrong:

- Use `low + (high - low) // 2` in languages with fixed-size integers to avoid overflow.
- Decide whether `high` is *inclusive* or *exclusive* and stay consistent.
- Duplicates: the code above returns *an* index, not necessarily the first one.

## Comparison

| Method        | Needs sorted data | Time (worst case) | Extra space |
|:--------------|:-----------------:|------------------:|------------:|
| Linear search | no                | $O(n)$            | $O(1)$      |
| Binary search | yes               | $O(\log n)$       | $O(1)$      |
| Hash table    | no                | $O(n)$ *(rare)*   | $O(n)$      |

## Checklist before the exam

- [x] Understand why the loop condition is `low <= high`
- [x] Trace the algorithm on `[1, 3, 5, 7, 9]` for the target `7`
- [ ] Implement the *lower bound* variant
- [ ] Read the chapter on balanced trees

## Further reading

See the [Wikipedia article on binary search](https://en.wikipedia.org/wiki/Binary_search_algorithm)
or the documentation of your language's standard library (`bisect` in Python, `std::lower_bound` in C++).

[^knuth]: Donald Knuth notes in *The Art of Computer Programming* that the first binary search was published in 1946, but the first bug-free version appeared only in 1962.
