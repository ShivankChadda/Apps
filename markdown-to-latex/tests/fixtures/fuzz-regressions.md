# Regressions found by fuzzing

Each case below once stopped LaTeX with an error. The document only has to build.

## A block quote as the first thing in a list

- > A quote that opens the very first list item.
- second item

1. > [!NOTE]
   > An alert that opens an ordered list.
2. ```
   code as the first thing of an item
   ```

## An unclosed bold tag, a dropped tag between two line breaks

h<b>
<a>
text after the dropped tag

## A heading whose second line is only an invisible character
​
Second line
-----------

## A line break after text that vanishes
​
<br>| after the break

## Math that must not break the build

Valid and invalid formulas side by side: $\frac{a}{b}$, $\frac{a}$, $x^2'$, $\left( a \\ b$, $a_1_2$, $\sqrt$, $\text{a_b}$,
$b_\2$, $\left x \right.$, and $f'(x\$.

$$
\begin{aligned} \left( a \\ b \right) \end{aligned}
$$

$$
a &= b \\
c &= d
$$
