# Math that needs extra packages

Formulas copied from GitHub, chatbots and lecture notes often use commands that plain LaTeX does not have.
The converter loads the package behind each command when a formula uses it.

## Bold, cancelled and script letters

A bold vector $\bm{x} \in \mathbb{R}^n$, the matrix $\bm{A}$, a cancelled term $\frac{\cancel{a} b}{\cancel{a} c}$ and a
script letter: $\mathscr{L}\{f\}(s) = \int_0^\infty e^{-st} f(t)\,dt$.

## Definitions and arrows

$$
f(x) \coloneqq x^2 + 1, \qquad A \xrightleftharpoons[\text{back}]{\text{forth}} B
$$

## Quantum mechanics

The state $\ket{\psi}$ and the inner product $\braket{\phi | \psi}$, with $\bra{\phi} \hat{H} \ket{\psi} = E \braket{\phi | \psi}$.

## Chemistry and units

Water is $\ce{H2O}$, and $\ce{2H2 + O2 -> 2H2O}$ releases energy. The speed was $\SI{299792458}{m/s}$ and the mass $\qty{5.97e24}{kg}$.

## Still plain LaTeX

$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$ and $\operatorname{argmax}_x f(x)$.
