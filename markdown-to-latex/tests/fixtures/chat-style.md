# 🚀 Complete Guide to Learning Rust in 30 Days

Here's a **structured plan** to get you from zero to productive. Let's dive in! 🎯

---

## 📋 Overview

| Week | Focus | Hours/Day | Status |
|------|-------|-----------|--------|
| 1 | Basics & ownership | 2 | ✅ Beginner-friendly |
| 2 | Structs, enums, traits | 2–3 | ⚠️ Gets harder |
| 3 | Concurrency & async | 3 | 🔥 Challenging |
| 4 | Projects | 3–4 | ✅ Fun |

> 💡 **Tip:** Consistency beats intensity. Even 45 minutes a day works!

---

## 🧠 Key Concepts

### 1. Ownership & Borrowing

Rust's ownership model ensures memory safety **without** a garbage collector:

- **Ownership**: each value has exactly one owner
- **Borrowing**: you can have *either* one `&mut` reference *or* many `&` references
- **Lifetimes**: the compiler tracks how long references are valid

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();        // explicit deep copy
    println!("{s1} and {s2}");  // both usable
}
```

### 2. Error Handling

Use `Result<T, E>` rather than exceptions:

1. Return `Result` from fallible functions
2. Use the `?` operator to propagate errors
3. Reserve `panic!` for unrecoverable bugs

**Example:**

```rust
use std::fs;

fn read_config(path: &str) -> Result<String, std::io::Error> {
    let text = fs::read_to_string(path)?;
    Ok(text.trim().to_string())
}
```

### 3. Performance ⚡

The cost of a `Vec::push` is amortized $O(1)$. For a sequence of $n$ pushes the total work is

\[
T(n) = \sum_{i=0}^{\lfloor \log_2 n \rfloor} 2^i \le 2n = O(n).
\]

---

## ✅ Checklist

- [x] Install `rustup`
- [x] Read *The Book* chapters 1–4
- [ ] Finish Rustlings exercises
- [ ] Build a CLI tool
  - [ ] Parse arguments with `clap`
  - [ ] Add tests

## ❌ Common Mistakes

| Mistake | Why it's a problem | Fix |
|---------|--------------------|-----|
| Fighting the borrow checker | Leads to frustration | Restructure your data |
| Overusing `clone()` | Hurts performance | Borrow instead |
| Ignoring `clippy` | Misses idioms | Run `cargo clippy` daily |

## 📚 Resources

- 📖 [The Rust Book](https://doc.rust-lang.org/book/)
- 🎥 [Jon Gjengset's streams](https://www.youtube.com/c/JonGjengset)
- 💬 [r/rust](https://www.reddit.com/r/rust/) → great community → very helpful

### Final thoughts

You've got this! 💪 Remember: **"The compiler is your friend."** 🦀

Would you like me to expand on any section? I can also create a *custom* study plan based on your schedule — just say "yes" 😊
