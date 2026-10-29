// =========================================================================
// NaTex Studio - Teclado Matemático y Científico Extendido (10 Categorías)
// Soporte integral: Matemáticas, Física, Química y Biología
// =========================================================================

const mathDatabase = {
    "algebra": [
        {
            "title": "Fracciones y Raíces",
            "titleEn": "Fractions & Roots",
            "items": [
                {
                    "display": "a/b",
                    "code": "\\frac{a}{b}",
                    "label": "Fracción",
                    "labelEn": "Fraction",
                    "cursorOffset": 6
                },
                {
                    "display": "dfrac",
                    "code": "\\dfrac{a}{b}",
                    "label": "Fracción display",
                    "labelEn": "Display fraction",
                    "cursorOffset": 7
                },
                {
                    "display": "1/x",
                    "code": "\\frac{1}{x}",
                    "label": "Inverso",
                    "labelEn": "Reciprocal",
                    "cursorOffset": 6
                },
                {
                    "display": "√x",
                    "code": "\\sqrt{x}",
                    "label": "Raíz cuadrada",
                    "labelEn": "Square root",
                    "cursorOffset": 6
                },
                {
                    "display": "ⁿ√x",
                    "code": "\\sqrt[n]{x}",
                    "label": "Raíz enésima",
                    "labelEn": "n-th root",
                    "cursorOffset": 8
                },
                {
                    "display": "x⁻¹",
                    "code": "x^{-1}",
                    "label": "Potencia negativa",
                    "labelEn": "Negative power",
                    "cursorOffset": 3
                }
            ]
        },
        {
            "title": "Potencias, Subíndices y Delimitadores",
            "titleEn": "Powers, Subscripts & Delimiters",
            "items": [
                {
                    "display": "xⁿ",
                    "code": "x^{n}",
                    "label": "Potencia",
                    "labelEn": "Superscript",
                    "cursorOffset": 3
                },
                {
                    "display": "xᵢ",
                    "code": "x_{i}",
                    "label": "Subíndice",
                    "labelEn": "Subscript",
                    "cursorOffset": 3
                },
                {
                    "display": "xᵢⁿ",
                    "code": "x_{i}^{n}",
                    "label": "Potencia y sub",
                    "labelEn": "Super & subscript",
                    "cursorOffset": 3
                },
                {
                    "display": "x²",
                    "code": "x^{2}",
                    "label": "Cuadrado",
                    "labelEn": "Square",
                    "cursorOffset": 3
                },
                {
                    "display": "x³",
                    "code": "x^{3}",
                    "label": "Cubo",
                    "labelEn": "Cube",
                    "cursorOffset": 3
                },
                {
                    "display": "(x)",
                    "code": "\\left( x \\right)",
                    "label": "Paréntesis esc.",
                    "labelEn": "Scalable parens",
                    "cursorOffset": 7
                },
                {
                    "display": "[x]",
                    "code": "\\left[ x \\right]",
                    "label": "Corchetes esc.",
                    "labelEn": "Scalable brackets",
                    "cursorOffset": 7
                },
                {
                    "display": "{x}",
                    "code": "\\left\\{ x \\right\\}",
                    "label": "Llaves esc.",
                    "labelEn": "Scalable braces",
                    "cursorOffset": 8
                },
                {
                    "display": "|x|",
                    "code": "\\left| x \\right|",
                    "label": "Valor absoluto",
                    "labelEn": "Absolute value",
                    "cursorOffset": 7
                },
                {
                    "display": "‖x‖",
                    "code": "\\left\\| \\vec{x} \\right\\|",
                    "label": "Norma / Módulo",
                    "labelEn": "Norm / Magnitude",
                    "cursorOffset": 8
                },
                {
                    "display": "⟨x⟩",
                    "code": "\\langle x \\rangle",
                    "label": "Promedio / Dirac",
                    "labelEn": "Average / Dirac",
                    "cursorOffset": 8
                }
            ]
        },
        {
            "title": "Operadores, Desigualdades y Relaciones",
            "titleEn": "Operators, Inequalities & Relations",
            "items": [
                {
                    "display": "±",
                    "code": "\\pm",
                    "label": "Más menos",
                    "labelEn": "Plus minus"
                },
                {
                    "display": "∓",
                    "code": "\\mp",
                    "label": "Menos más",
                    "labelEn": "Minus plus"
                },
                {
                    "display": "×",
                    "code": "\\times",
                    "label": "Multiplicación",
                    "labelEn": "Multiplication"
                },
                {
                    "display": "÷",
                    "code": "\\div",
                    "label": "División",
                    "labelEn": "Division"
                },
                {
                    "display": "·",
                    "code": "\\cdot",
                    "label": "Punto multiplicación",
                    "labelEn": "Dot product / mult"
                },
                {
                    "display": "≈",
                    "code": "\\approx",
                    "label": "Aproximadamente",
                    "labelEn": "Approximately"
                },
                {
                    "display": "≠",
                    "code": "\\neq",
                    "label": "Diferente",
                    "labelEn": "Not equal"
                },
                {
                    "display": "≤",
                    "code": "\\le",
                    "label": "Menor o igual",
                    "labelEn": "Less than or equal"
                },
                {
                    "display": "≥",
                    "code": "\\ge",
                    "label": "Mayor o igual",
                    "labelEn": "Greater than or equal"
                },
                {
                    "display": "≪",
                    "code": "\\ll",
                    "label": "Mucho menor",
                    "labelEn": "Much less than"
                },
                {
                    "display": "≫",
                    "code": "\\gg",
                    "label": "Mucho mayor",
                    "labelEn": "Much greater than"
                },
                {
                    "display": "≡",
                    "code": "\\equiv",
                    "label": "Congruente / Idéntico",
                    "labelEn": "Congruent / Identical"
                },
                {
                    "display": "∝",
                    "code": "\\propto",
                    "label": "Proporcional a",
                    "labelEn": "Proportional to"
                },
                {
                    "display": "∞",
                    "code": "\\infty",
                    "label": "Infinito",
                    "labelEn": "Infinity"
                },
                {
                    "display": "text",
                    "code": "\\text{ texto }",
                    "label": "Texto en fórmula",
                    "labelEn": "Text in formula",
                    "cursorOffset": 6
                }
            ]
        },
        {
            "title": "Polinomios, Ecuaciones y Factorización",
            "titleEn": "Polynomials, Equations & Factoring",
            "items": [
                {
                    "display": "Ec. Cuadrática",
                    "code": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
                    "label": "Fórmula cuadrática",
                    "labelEn": "Quadratic formula"
                },
                {
                    "display": "(a+b)²",
                    "code": "(a+b)^2 = a^2 + 2ab + b^2",
                    "label": "Binomio al cuadrado",
                    "labelEn": "Square of a sum"
                },
                {
                    "display": "(a-b)²",
                    "code": "(a-b)^2 = a^2 - 2ab + b^2",
                    "label": "Binomio resta cuadrado",
                    "labelEn": "Square of a difference"
                },
                {
                    "display": "a²-b²",
                    "code": "a^2 - b^2 = (a-b)(a+b)",
                    "label": "Diferencia de cuadrados",
                    "labelEn": "Difference of squares"
                },
                {
                    "display": "(a+b)³",
                    "code": "(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3",
                    "label": "Binomio al cubo",
                    "labelEn": "Cube of a sum"
                },
                {
                    "display": "Binomio (n k)",
                    "code": "\\binom{n}{k} = \\frac{n!}{k!(n-k)!}",
                    "label": "Coeficiente binomial",
                    "labelEn": "Binomial coefficient"
                },
                {
                    "display": "n!",
                    "code": "n!",
                    "label": "Factorial",
                    "labelEn": "Factorial"
                },
                {
                    "display": "P(n,k)",
                    "code": "P(n,k) = \\frac{n!}{(n-k)!}",
                    "label": "Permutaciones",
                    "labelEn": "Permutations"
                },
                {
                    "display": "C(n,k)",
                    "code": "C(n,k) = \\binom{n}{k}",
                    "label": "Combinaciones",
                    "labelEn": "Combinations"
                }
            ]
        },
        {
            "title": "Logaritmos y Exponenciales",
            "titleEn": "Logarithms & Exponentials",
            "items": [
                {
                    "display": "ln(x)",
                    "code": "\\ln(x)",
                    "label": "Logaritmo natural",
                    "labelEn": "Natural log"
                },
                {
                    "display": "log(x)",
                    "code": "\\log(x)",
                    "label": "Logaritmo decimal",
                    "labelEn": "Common log (base 10)"
                },
                {
                    "display": "log_b(x)",
                    "code": "\\log_{b}(x)",
                    "label": "Logaritmo en base b",
                    "labelEn": "Log base b",
                    "cursorOffset": 5
                },
                {
                    "display": "eˣ",
                    "code": "e^{x}",
                    "label": "Exponencial",
                    "labelEn": "Exponential base e",
                    "cursorOffset": 3
                },
                {
                    "display": "exp(x)",
                    "code": "\\exp(x)",
                    "label": "Función exp",
                    "labelEn": "exp function",
                    "cursorOffset": 5
                },
                {
                    "display": "10ˣ",
                    "code": "10^{x}",
                    "label": "Potencia de 10",
                    "labelEn": "Power of 10",
                    "cursorOffset": 4
                },
                {
                    "display": "aˣ",
                    "code": "a^{x}",
                    "label": "Exponencial base a",
                    "labelEn": "Exponential base a",
                    "cursorOffset": 3
                },
                {
                    "display": "ln(ab)",
                    "code": "\\ln(ab) = \\ln(a) + \\ln(b)",
                    "label": "Propiedad producto log",
                    "labelEn": "Log product rule"
                },
                {
                    "display": "Cambio base",
                    "code": "\\log_b(a) = \\frac{\\ln(a)}{\\ln(b)}",
                    "label": "Cambio de base",
                    "labelEn": "Change of base formula"
                }
            ]
        },
        {
            "title": "Trigonometría e Hiperbólicas",
            "titleEn": "Trigonometry & Hyperbolics",
            "items": [
                {
                    "display": "sin(x)",
                    "code": "\\sin(x)",
                    "label": "Seno",
                    "labelEn": "Sine"
                },
                {
                    "display": "cos(x)",
                    "code": "\\cos(x)",
                    "label": "Coseno",
                    "labelEn": "Cosine"
                },
                {
                    "display": "tan(x)",
                    "code": "\\tan(x)",
                    "label": "Tangente",
                    "labelEn": "Tangent"
                },
                {
                    "display": "cot(x)",
                    "code": "\\cot(x)",
                    "label": "Cotangente",
                    "labelEn": "Cotangent"
                },
                {
                    "display": "sec(x)",
                    "code": "\\sec(x)",
                    "label": "Secante",
                    "labelEn": "Secant"
                },
                {
                    "display": "csc(x)",
                    "code": "\\csc(x)",
                    "label": "Cosecante",
                    "labelEn": "Cosecant"
                },
                {
                    "display": "arcsin",
                    "code": "\\arcsin(x)",
                    "label": "Arcoseno",
                    "labelEn": "Arcsine"
                },
                {
                    "display": "arccos",
                    "code": "\\arccos(x)",
                    "label": "Arcocoseno",
                    "labelEn": "Arccosine"
                },
                {
                    "display": "arctan",
                    "code": "\\arctan(x)",
                    "label": "Arcotangente",
                    "labelEn": "Arctangent"
                },
                {
                    "display": "sinh(x)",
                    "code": "\\sinh(x)",
                    "label": "Seno hiperbólico",
                    "labelEn": "Hyperbolic sine"
                },
                {
                    "display": "cosh(x)",
                    "code": "\\cosh(x)",
                    "label": "Coseno hiperbólico",
                    "labelEn": "Hyperbolic cosine"
                },
                {
                    "display": "tanh(x)",
                    "code": "\\tanh(x)",
                    "label": "Tangente hiperbólica",
                    "labelEn": "Hyperbolic tangent"
                },
                {
                    "display": "sin²+cos²=1",
                    "code": "\\sin^2(x) + \\cos^2(x) = 1",
                    "label": "Identidad fundamental",
                    "labelEn": "Fundamental identity"
                },
                {
                    "display": "sin(2x)",
                    "code": "\\sin(2x) = 2\\sin(x)\\cos(x)",
                    "label": "Seno ángulo doble",
                    "labelEn": "Double angle sine"
                }
            ]
        },
        {
            "title": "Sistemas de Ecuaciones, Casos y Progresiones",
            "titleEn": "Systems of Equations & Progressions",
            "items": [
                {
                    "display": "Sistema 2x2",
                    "code": "\\begin{cases}\n  a_1 x + b_1 y = c_1 \\\\\n  a_2 x + b_2 y = c_2\n\\end{cases}",
                    "label": "Sistema 2x2",
                    "labelEn": "2x2 System"
                },
                {
                    "display": "Sistema 3x3",
                    "code": "\\begin{cases}\n  x + y + z = d_1 \\\\\n  2x - y + z = d_2 \\\\\n  -x + 2y + 2z = d_3\n\\end{cases}",
                    "label": "Sistema 3x3",
                    "labelEn": "3x3 System"
                },
                {
                    "display": "Función trozos",
                    "code": "f(x) = \\begin{cases}\n  x^2 & \\text{si } x \\ge 0 \\\\\n  -x & \\text{si } x < 0\n\\end{cases}",
                    "label": "Función a trozos (cases)",
                    "labelEn": "Piecewise function"
                },
                {
                    "display": "Prog. Aritm.",
                    "code": "a_n = a_1 + (n-1)d",
                    "label": "Progresión aritmética",
                    "labelEn": "Arithmetic progression"
                },
                {
                    "display": "Prog. Geom.",
                    "code": "a_n = a_1 \\cdot r^{n-1}",
                    "label": "Progresión geométrica",
                    "labelEn": "Geometric progression"
                },
                {
                    "display": "Suma Aritm.",
                    "code": "S_n = \\frac{n(a_1 + a_n)}{2}",
                    "label": "Suma progresión aritmética",
                    "labelEn": "Arithmetic sum"
                }
            ]
        }
    ],
    "calculus": [
        {
            "title": "Derivadas Ordinarias, Parciales y Temporales",
            "titleEn": "Ordinary, Partial & Time Derivatives",
            "items": [
                {
                    "display": "df/dx",
                    "code": "\\frac{df}{dx}",
                    "label": "Derivada ordinaria",
                    "labelEn": "Ordinary derivative",
                    "cursorOffset": 6
                },
                {
                    "display": "d²f/dx²",
                    "code": "\\frac{d^2 f}{dx^2}",
                    "label": "Segunda derivada",
                    "labelEn": "Second derivative",
                    "cursorOffset": 8
                },
                {
                    "display": "dⁿf/dxⁿ",
                    "code": "\\frac{d^n f}{dx^n}",
                    "label": "Derivada enésima",
                    "labelEn": "n-th derivative",
                    "cursorOffset": 8
                },
                {
                    "display": "∂f/∂x",
                    "code": "\\frac{\\partial f}{\\partial x}",
                    "label": "Derivada parcial",
                    "labelEn": "Partial derivative",
                    "cursorOffset": 15
                },
                {
                    "display": "∂²f/∂x²",
                    "code": "\\frac{\\partial^2 f}{\\partial x^2}",
                    "label": "Segunda parcial",
                    "labelEn": "Second partial",
                    "cursorOffset": 17
                },
                {
                    "display": "∂²f/∂x∂y",
                    "code": "\\frac{\\partial^2 f}{\\partial x \\partial y}",
                    "label": "Parcial cruzada",
                    "labelEn": "Mixed partial",
                    "cursorOffset": 17
                },
                {
                    "display": "∂/∂t",
                    "code": "\\frac{\\partial}{\\partial t}",
                    "label": "Parcial temporal",
                    "labelEn": "Time partial",
                    "cursorOffset": 15
                },
                {
                    "display": "∂²/∂t²",
                    "code": "\\frac{\\partial^2}{\\partial t^2}",
                    "label": "Segunda temporal",
                    "labelEn": "Second time partial",
                    "cursorOffset": 17
                },
                {
                    "display": "ẋ, ẍ",
                    "code": "\\dot{x}, \\ddot{x}",
                    "label": "Notación Newton (tiempo)",
                    "labelEn": "Newton dot notation"
                },
                {
                    "display": "y', y''",
                    "code": "y', y'', y'''",
                    "label": "Notación Lagrange",
                    "labelEn": "Lagrange prime notation"
                },
                {
                    "display": "Regla Cadena",
                    "code": "\\frac{df}{dt} = \\frac{\\partial f}{\\partial x}\\frac{dx}{dt} + \\frac{\\partial f}{\\partial y}\\frac{dy}{dt}",
                    "label": "Regla de la cadena",
                    "labelEn": "Multivariate chain rule"
                },
                {
                    "display": "Diferencial df",
                    "code": "df = \\frac{\\partial f}{\\partial x}dx + \\frac{\\partial f}{\\partial y}dy",
                    "label": "Diferencial total",
                    "labelEn": "Total differential"
                },
                {
                    "display": "∂_μ",
                    "code": "\\partial_\\mu",
                    "label": "Operador 4-parcial",
                    "labelEn": "4-gradient operator"
                }
            ]
        },
        {
            "title": "Integrales Simples, Múltiples y de Contorno",
            "titleEn": "Single, Multiple & Contour Integrals",
            "items": [
                {
                    "display": "∫ f dx",
                    "code": "\\int f(x) \\, dx",
                    "label": "Integral indefinida",
                    "labelEn": "Indefinite integral",
                    "cursorOffset": 5
                },
                {
                    "display": "∫ₐᵇ",
                    "code": "\\int_{a}^{b} f(x) \\, dx",
                    "label": "Integral definida",
                    "labelEn": "Definite integral",
                    "cursorOffset": 6
                },
                {
                    "display": "∫₋∞^∞",
                    "code": "\\int_{-\\infty}^{\\infty} f(x) \\, dx",
                    "label": "Integral impropia completa",
                    "labelEn": "Improper integral (-∞, ∞)",
                    "cursorOffset": 24
                },
                {
                    "display": "∫₀^∞",
                    "code": "\\int_{0}^{\\infty} f(x) \\, dx",
                    "label": "Integral impropia [0, ∞)",
                    "labelEn": "Improper integral [0, ∞)",
                    "cursorOffset": 18
                },
                {
                    "display": "∬",
                    "code": "\\iint_{D} f(x,y) \\, dx \\, dy",
                    "label": "Integral doble",
                    "labelEn": "Double integral",
                    "cursorOffset": 7
                },
                {
                    "display": "∭",
                    "code": "\\iiint_{V} f(x,y,z) \\, dV",
                    "label": "Integral triple",
                    "labelEn": "Triple integral",
                    "cursorOffset": 8
                },
                {
                    "display": "∮",
                    "code": "\\oint_{C} \\vec{F} \\cdot d\\vec{r}",
                    "label": "Integral de línea cerrada",
                    "labelEn": "Closed line integral",
                    "cursorOffset": 7
                },
                {
                    "display": "∯",
                    "code": "\\oiint_{S} \\vec{E} \\cdot d\\vec{A}",
                    "label": "Integral de superficie cerrada",
                    "labelEn": "Closed surface integral",
                    "cursorOffset": 8
                },
                {
                    "display": "Por Partes",
                    "code": "\\int u \\, dv = uv - \\int v \\, du",
                    "label": "Integración por partes",
                    "labelEn": "Integration by parts"
                },
                {
                    "display": "Teor. Fund.",
                    "code": "\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)",
                    "label": "Teorema fundamental del cálculo",
                    "labelEn": "Fundamental theorem of calculus"
                },
                {
                    "display": "Longitud Arco",
                    "code": "L = \\int_{a}^{b} \\sqrt{1 + [f'(x)]^2} \\, dx",
                    "label": "Longitud de curva",
                    "labelEn": "Arc length of curve"
                }
            ]
        },
        {
            "title": "Límites, Continuidad y Reglas",
            "titleEn": "Limits, Continuity & Rules",
            "items": [
                {
                    "display": "lim x→a",
                    "code": "\\lim_{x \\to a} f(x)",
                    "label": "Límite puntual",
                    "labelEn": "Point limit",
                    "cursorOffset": 9
                },
                {
                    "display": "lim x→∞",
                    "code": "\\lim_{x \\to \\infty} f(x)",
                    "label": "Límite al infinito",
                    "labelEn": "Limit to infinity",
                    "cursorOffset": 20
                },
                {
                    "display": "lim x→-∞",
                    "code": "\\lim_{x \\to -\\infty} f(x)",
                    "label": "Límite a menos infinito",
                    "labelEn": "Limit to minus infinity",
                    "cursorOffset": 21
                },
                {
                    "display": "lim x→0⁺",
                    "code": "\\lim_{x \\to 0^+} f(x)",
                    "label": "Límite lateral derecho",
                    "labelEn": "Right-hand limit",
                    "cursorOffset": 17
                },
                {
                    "display": "lim x→0⁻",
                    "code": "\\lim_{x \\to 0^-} f(x)",
                    "label": "Límite lateral izquierdo",
                    "labelEn": "Left-hand limit",
                    "cursorOffset": 17
                },
                {
                    "display": "Def. Derivada",
                    "code": "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
                    "label": "Definición derivada",
                    "labelEn": "Derivative definition"
                },
                {
                    "display": "L'Hôpital",
                    "code": "\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}",
                    "label": "Regla de L'Hôpital",
                    "labelEn": "L'Hopital's Rule"
                }
            ]
        },
        {
            "title": "Series, Sumatorias y Productos",
            "titleEn": "Series, Summations & Products",
            "items": [
                {
                    "display": "∑ᵢ₌₁ⁿ",
                    "code": "\\sum_{i=1}^{n} a_i",
                    "label": "Sumatoria finita",
                    "labelEn": "Finite sum",
                    "cursorOffset": 6
                },
                {
                    "display": "∑ₙ₌₀^∞",
                    "code": "\\sum_{n=0}^{\\infty} a_n",
                    "label": "Serie infinita",
                    "labelEn": "Infinite series",
                    "cursorOffset": 6
                },
                {
                    "display": "∏ᵢ₌₁ⁿ",
                    "code": "\\prod_{i=1}^{n} x_i",
                    "label": "Productoria",
                    "labelEn": "Product",
                    "cursorOffset": 6
                },
                {
                    "display": "Serie Taylor",
                    "code": "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n",
                    "label": "Serie de Taylor",
                    "labelEn": "Taylor series"
                },
                {
                    "display": "Maclaurin",
                    "code": "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(0)}{n!} x^n",
                    "label": "Serie de Maclaurin",
                    "labelEn": "Maclaurin series"
                },
                {
                    "display": "Serie Geom.",
                    "code": "\\sum_{k=0}^{\\infty} r^k = \\frac{1}{1-r}",
                    "label": "Serie geométrica",
                    "labelEn": "Geometric series"
                },
                {
                    "display": "Serie Exp.",
                    "code": "e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}",
                    "label": "Serie exponencial",
                    "labelEn": "Exponential series"
                },
                {
                    "display": "Fourier",
                    "code": "f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\left( a_n \\cos\\frac{n\\pi x}{L} + b_n \\sin\\frac{n\\pi x}{L} \\right)",
                    "label": "Serie de Fourier",
                    "labelEn": "Fourier series"
                }
            ]
        },
        {
            "title": "Cálculo Vectorial y Teoremas Integrales",
            "titleEn": "Vector Calculus & Integral Theorems",
            "items": [
                {
                    "display": "∇f",
                    "code": "\\nabla f",
                    "label": "Gradiente",
                    "labelEn": "Gradient"
                },
                {
                    "display": "∇·F",
                    "code": "\\nabla \\cdot \\vec{F}",
                    "label": "Divergencia",
                    "labelEn": "Divergence"
                },
                {
                    "display": "∇×F",
                    "code": "\\nabla \\times \\vec{F}",
                    "label": "Rotacional",
                    "labelEn": "Curl"
                },
                {
                    "display": "∇²f",
                    "code": "\\nabla^2 f",
                    "label": "Laplaciano",
                    "labelEn": "Laplacian"
                },
                {
                    "display": "Teor. Green",
                    "code": "\\oint_{\\partial D} (P\\,dx + Q\\,dy) = \\iint_{D} \\left( \\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y} \\right) dA",
                    "label": "Teorema de Green",
                    "labelEn": "Green's Theorem"
                },
                {
                    "display": "Teor. Stokes",
                    "code": "\\oint_{C} \\vec{F} \\cdot d\\vec{r} = \\iint_{S} (\\nabla \\times \\vec{F}) \\cdot d\\vec{A}",
                    "label": "Teorema de Stokes",
                    "labelEn": "Stokes' Theorem"
                },
                {
                    "display": "Teor. Gauss",
                    "code": "\\iiint_{V} (\\nabla \\cdot \\vec{F}) \\, dV = \\oiint_{\\partial V} \\vec{F} \\cdot d\\vec{A}",
                    "label": "Teorema de la Divergencia (Gauss)",
                    "labelEn": "Divergence Theorem (Gauss)"
                }
            ]
        },
        {
            "title": "Ecuaciones Diferenciales y Transformadas",
            "titleEn": "Differential Equations & Transforms",
            "items": [
                {
                    "display": "EDO 1er orden",
                    "code": "y' + P(x)y = Q(x)",
                    "label": "EDO lineal 1er orden",
                    "labelEn": "1st order linear ODE"
                },
                {
                    "display": "EDO 2do orden",
                    "code": "a y'' + b y' + c y = f(x)",
                    "label": "EDO lineal 2do orden",
                    "labelEn": "2nd order linear ODE"
                },
                {
                    "display": "Oscilador",
                    "code": "m\\ddot{x} + c\\dot{x} + kx = F(t)",
                    "label": "Oscilador armónico",
                    "labelEn": "Harmonic oscillator"
                },
                {
                    "display": "Ec. Onda",
                    "code": "\\frac{\\partial^2 u}{\\partial t^2} = v^2 \\nabla^2 u",
                    "label": "Ecuación de onda",
                    "labelEn": "Wave equation"
                },
                {
                    "display": "Ec. Calor",
                    "code": "\\frac{\\partial u}{\\partial t} = \\alpha \\nabla^2 u",
                    "label": "Ecuación del calor",
                    "labelEn": "Heat equation"
                },
                {
                    "display": "Laplace Ec.",
                    "code": "\\nabla^2 \\phi = 0",
                    "label": "Ecuación de Laplace",
                    "labelEn": "Laplace's equation"
                },
                {
                    "display": "Poisson Ec.",
                    "code": "\\nabla^2 \\phi = -\\frac{\\rho}{\\varepsilon_0}",
                    "label": "Ecuación de Poisson",
                    "labelEn": "Poisson's equation"
                },
                {
                    "display": "Transf. Laplace",
                    "code": "\\mathcal{L}\\{f(t)\\} = \\int_{0}^{\\infty} e^{-st} f(t) \\, dt",
                    "label": "Transformada de Laplace",
                    "labelEn": "Laplace transform"
                },
                {
                    "display": "Transf. Fourier",
                    "code": "\\mathcal{F}\\{f(t)\\} = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} \\, dt",
                    "label": "Transformada de Fourier",
                    "labelEn": "Fourier transform"
                }
            ]
        }
    ],
    "matrices": [
        {
            "title": "Matrices con Paréntesis y Corchetes",
            "titleEn": "Matrices with Parentheses & Brackets",
            "items": [
                {
                    "display": "Matriz 2x2",
                    "code": "\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}",
                    "label": "Matriz 2x2 (pmatrix)",
                    "labelEn": "2x2 Matrix (pmatrix)"
                },
                {
                    "display": "Matriz 3x3",
                    "code": "\\begin{pmatrix}\n  a_{11} & a_{12} & a_{13} \\\\\n  a_{21} & a_{22} & a_{23} \\\\\n  a_{31} & a_{32} & a_{33}\n\\end{pmatrix}",
                    "label": "Matriz 3x3 (pmatrix)",
                    "labelEn": "3x3 Matrix (pmatrix)"
                },
                {
                    "display": "Corchetes 2x2",
                    "code": "\\begin{bmatrix}\n  a & b \\\\\n  c & d\n\\end{bmatrix}",
                    "label": "Matriz 2x2 (bmatrix)",
                    "labelEn": "2x2 Matrix (bmatrix)"
                },
                {
                    "display": "Corchetes 3x3",
                    "code": "\\begin{bmatrix}\n  a & b & c \\\\\n  d & e & f \\\\\n  g & h & i\n\\end{bmatrix}",
                    "label": "Matriz 3x3 (bmatrix)",
                    "labelEn": "3x3 Matrix (bmatrix)"
                }
            ]
        },
        {
            "title": "Determinantes, Normas y Vectores",
            "titleEn": "Determinants, Norms & Vectors",
            "items": [
                {
                    "display": "Det 2x2",
                    "code": "\\begin{vmatrix}\n  a & b \\\\\n  c & d\n\\end{vmatrix}",
                    "label": "Determinante 2x2",
                    "labelEn": "2x2 Determinant"
                },
                {
                    "display": "Det 3x3",
                    "code": "\\begin{vmatrix}\n  a & b & c \\\\\n  d & e & f \\\\\n  g & h & i\n\\end{vmatrix}",
                    "label": "Determinante 3x3",
                    "labelEn": "3x3 Determinant"
                },
                {
                    "display": "Vec Columna",
                    "code": "\\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}",
                    "label": "Vector columna 3D",
                    "labelEn": "3D Column vector"
                },
                {
                    "display": "Vec Fila",
                    "code": "\\begin{pmatrix} x & y & z \\end{pmatrix}",
                    "label": "Vector fila 3D",
                    "labelEn": "3D Row vector"
                },
                {
                    "display": "v⃗",
                    "code": "\\vec{v}",
                    "label": "Vector con flecha",
                    "labelEn": "Vector with arrow"
                },
                {
                    "display": "v̂",
                    "code": "\\hat{v}",
                    "label": "Vector unitario",
                    "labelEn": "Unit vector"
                },
                {
                    "display": "‖v‖",
                    "code": "\\|\\vec{v}\\| = \\sqrt{v_x^2 + v_y^2 + v_z^2}",
                    "label": "Norma euclídea",
                    "labelEn": "Euclidean norm"
                },
                {
                    "display": "Aᵀ",
                    "code": "A^T",
                    "label": "Transpuesta",
                    "labelEn": "Transpose"
                },
                {
                    "display": "A⁻¹",
                    "code": "A^{-1}",
                    "label": "Inversa",
                    "labelEn": "Inverse"
                },
                {
                    "display": "A†",
                    "code": "A^\\dagger",
                    "label": "Hermítico adjunto",
                    "labelEn": "Conjugate transpose"
                }
            ]
        },
        {
            "title": "Operaciones Matriciales y Valores Propios",
            "titleEn": "Matrix Operations & Eigenvalues",
            "items": [
                {
                    "display": "u·v",
                    "code": "\\vec{u} \\cdot \\vec{v} = u_x v_x + u_y v_y + u_z v_z",
                    "label": "Producto escalar",
                    "labelEn": "Dot product"
                },
                {
                    "display": "u×v",
                    "code": "\\vec{u} \\times \\vec{v} = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ u_x & u_y & u_z \\\\ v_x & v_y & v_z \\end{vmatrix}",
                    "label": "Producto vectorial",
                    "labelEn": "Cross product"
                },
                {
                    "display": "u⊗v",
                    "code": "\\vec{u} \\otimes \\vec{v}",
                    "label": "Producto tensorial",
                    "labelEn": "Tensor product"
                },
                {
                    "display": "Av=λv",
                    "code": "A \\vec{v} = \\lambda \\vec{v}",
                    "label": "Autovalores y autovectores",
                    "labelEn": "Eigenvalues & eigenvectors"
                },
                {
                    "display": "det(A-λI)=0",
                    "code": "\\det(A - \\lambda I) = 0",
                    "label": "Ecuación característica",
                    "labelEn": "Characteristic equation"
                },
                {
                    "display": "tr(A)",
                    "code": "\\text{tr}(A) = \\sum_{i=1}^{n} a_{ii}",
                    "label": "Traza de matriz",
                    "labelEn": "Trace of matrix"
                },
                {
                    "display": "diag(...)",
                    "code": "\\text{diag}(\\lambda_1, \\lambda_2, \\dots, \\lambda_n)",
                    "label": "Matriz diagonal",
                    "labelEn": "Diagonal matrix"
                }
            ]
        }
    ],
    "estadistica": [
        {
            "title": "Parámetros y Medidas Estadísticas",
            "titleEn": "Statistical Parameters & Measures",
            "items": [
                {
                    "display": "E[X]",
                    "code": "\\mathbb{E}[X] = \\sum_{x} x P(X=x)",
                    "label": "Esperanza matemática",
                    "labelEn": "Expected value"
                },
                {
                    "display": "Var(X)",
                    "code": "\\text{Var}(X) = \\mathbb{E}[X^2] - (\\mathbb{E}[X])^2",
                    "label": "Varianza teórica",
                    "labelEn": "Theoretical variance"
                },
                {
                    "display": "Cov(X,Y)",
                    "code": "\\text{Cov}(X,Y) = \\mathbb{E}[(X-\\mu_X)(Y-\\mu_Y)]",
                    "label": "Covarianza",
                    "labelEn": "Covariance"
                },
                {
                    "display": "Corr(X,Y)",
                    "code": "\\rho_{XY} = \\frac{\\text{Cov}(X,Y)}{\\sigma_X \\sigma_Y}",
                    "label": "Correlación de Pearson",
                    "labelEn": "Pearson correlation"
                },
                {
                    "display": "x̄ (media)",
                    "code": "\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i",
                    "label": "Media muestral",
                    "labelEn": "Sample mean"
                },
                {
                    "display": "s² (var. muestral)",
                    "code": "s^2 = \\frac{1}{n-1} \\sum_{i=1}^{n} (x_i - \\bar{x})^2",
                    "label": "Varianza muestral insesgada",
                    "labelEn": "Sample variance"
                },
                {
                    "display": "θ̂ (estimador)",
                    "code": "\\hat{\\theta}",
                    "label": "Estimador puntual",
                    "labelEn": "Point estimator"
                },
                {
                    "display": "z-score",
                    "code": "z = \\frac{x - \\mu}{\\sigma}",
                    "label": "Puntaje tipificado z",
                    "labelEn": "Standardized score (z-score)"
                },
                {
                    "display": "Error estándar",
                    "code": "\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}",
                    "label": "Error estándar de la media",
                    "labelEn": "Standard error of the mean"
                }
            ]
        },
        {
            "title": "Probabilidad, Bayes y Distribuciones",
            "titleEn": "Probability, Bayes & Distributions",
            "items": [
                {
                    "display": "P(A|B)",
                    "code": "P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}",
                    "label": "Probabilidad condicional",
                    "labelEn": "Conditional probability"
                },
                {
                    "display": "Teor. Bayes",
                    "code": "P(A \\mid B) = \\frac{P(B \\mid A)P(A)}{P(B)}",
                    "label": "Teorema de Bayes",
                    "labelEn": "Bayes' Theorem"
                },
                {
                    "display": "Normal N(μ,σ²)",
                    "code": "f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
                    "label": "Distribución Normal (Gaussiana)",
                    "labelEn": "Normal distribution"
                },
                {
                    "display": "Binomial B(n,p)",
                    "code": "P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}",
                    "label": "Distribución Binomial",
                    "labelEn": "Binomial distribution"
                },
                {
                    "display": "Poisson(λ)",
                    "code": "P(X=k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}",
                    "label": "Distribución de Poisson",
                    "labelEn": "Poisson distribution"
                },
                {
                    "display": "Uniforme U(a,b)",
                    "code": "f(x) = \\frac{1}{b-a}",
                    "label": "Distribución Uniforme continua",
                    "labelEn": "Uniform distribution"
                },
                {
                    "display": "Exponencial",
                    "code": "f(x) = \\lambda e^{-\\lambda x}",
                    "label": "Distribución Exponencial",
                    "labelEn": "Exponential distribution"
                },
                {
                    "display": "χ² (Chi-cuadrado)",
                    "code": "\\chi^2 = \\sum_{i=1}^{k} \\frac{(O_i - E_i)^2}{E_i}",
                    "label": "Estadístico Chi-cuadrado",
                    "labelEn": "Chi-square statistic"
                },
                {
                    "display": "t-Student",
                    "code": "t = \\frac{\\bar{x} - \\mu}{s / \\sqrt{n}}",
                    "label": "Estadístico t de Student",
                    "labelEn": "Student's t-statistic"
                },
                {
                    "display": "Intervalo Confianza",
                    "code": "\\bar{x} \\pm z^* \\frac{\\sigma}{\\sqrt{n}}",
                    "label": "Intervalo de confianza",
                    "labelEn": "Confidence interval"
                }
            ]
        }
    ],
    "logica": [
        {
            "title": "Cuantificadores y Conectivos Lógicos",
            "titleEn": "Quantifiers & Logical Connectives",
            "items": [
                {
                    "display": "∀",
                    "code": "\\forall",
                    "label": "Para todo (universal)",
                    "labelEn": "For all (universal)"
                },
                {
                    "display": "∃",
                    "code": "\\exists",
                    "label": "Existe (existencial)",
                    "labelEn": "There exists"
                },
                {
                    "display": "∄",
                    "code": "\\nexists",
                    "label": "No existe",
                    "labelEn": "There does not exist"
                },
                {
                    "display": "∃!",
                    "code": "\\exists !",
                    "label": "Existe un único",
                    "labelEn": "There exists a unique"
                },
                {
                    "display": "∧",
                    "code": "\\land",
                    "label": "Conjunción (Y)",
                    "labelEn": "Conjunction (AND)"
                },
                {
                    "display": "∨",
                    "code": "\\lor",
                    "label": "Disyunción (O)",
                    "labelEn": "Disjunction (OR)"
                },
                {
                    "display": "¬",
                    "code": "\\neg",
                    "label": "Negación (NO)",
                    "labelEn": "Negation (NOT)"
                },
                {
                    "display": "⇒",
                    "code": "\\implies",
                    "label": "Implicación material",
                    "labelEn": "Implies (material)"
                },
                {
                    "display": "⇔",
                    "code": "\\iff",
                    "label": "Doble implicación (si y solo si)",
                    "labelEn": "If and only if (iff)"
                },
                {
                    "display": "∴",
                    "code": "\\therefore",
                    "label": "Por lo tanto",
                    "labelEn": "Therefore"
                },
                {
                    "display": "∵",
                    "code": "\\because",
                    "label": "Dado que / Porque",
                    "labelEn": "Because"
                },
                {
                    "display": "⊢",
                    "code": "\\vdash",
                    "label": "Deducción sintáctica (Turnstile)",
                    "labelEn": "Syntactic entailment"
                },
                {
                    "display": "⊨",
                    "code": "\\models",
                    "label": "Consecuencia semántica / Modelo",
                    "labelEn": "Semantic consequence / Models"
                }
            ]
        },
        {
            "title": "Teoría de Conjuntos y Cardinalidad",
            "titleEn": "Set Theory & Cardinality",
            "items": [
                {
                    "display": "∈",
                    "code": "\\in",
                    "label": "Pertenece a",
                    "labelEn": "Element of"
                },
                {
                    "display": "∉",
                    "code": "\\notin",
                    "label": "No pertenece a",
                    "labelEn": "Not an element of"
                },
                {
                    "display": "⊂",
                    "code": "\\subset",
                    "label": "Subconjunto propio",
                    "labelEn": "Proper subset"
                },
                {
                    "display": "⊆",
                    "code": "\\subseteq",
                    "label": "Subconjunto o igual",
                    "labelEn": "Subset or equal"
                },
                {
                    "display": "⊃",
                    "code": "\\supset",
                    "label": "Superconjunto",
                    "labelEn": "Superset"
                },
                {
                    "display": "∪",
                    "code": "\\cup",
                    "label": "Unión",
                    "labelEn": "Union"
                },
                {
                    "display": "∩",
                    "code": "\\cap",
                    "label": "Intersección",
                    "labelEn": "Intersection"
                },
                {
                    "display": "∖",
                    "code": "\\setminus",
                    "label": "Diferencia de conjuntos",
                    "labelEn": "Set difference"
                },
                {
                    "display": "Aᶜ",
                    "code": "A^c",
                    "label": "Complemento de conjunto",
                    "labelEn": "Complement of set"
                },
                {
                    "display": "∅",
                    "code": "\\emptyset",
                    "label": "Conjunto vacío",
                    "labelEn": "Empty set"
                },
                {
                    "display": "P(A)",
                    "code": "\\mathcal{P}(A)",
                    "label": "Conjunto potencia",
                    "labelEn": "Power set"
                },
                {
                    "display": "ℕ",
                    "code": "\\mathbb{N}",
                    "label": "Números Naturales",
                    "labelEn": "Natural numbers"
                },
                {
                    "display": "ℤ",
                    "code": "\\mathbb{Z}",
                    "label": "Números Enteros",
                    "labelEn": "Integers"
                },
                {
                    "display": "ℚ",
                    "code": "\\mathbb{Q}",
                    "label": "Números Racionales",
                    "labelEn": "Rational numbers"
                },
                {
                    "display": "ℝ",
                    "code": "\\mathbb{R}",
                    "label": "Números Reales",
                    "labelEn": "Real numbers"
                },
                {
                    "display": "ℂ",
                    "code": "\\mathbb{C}",
                    "label": "Números Complejos",
                    "labelEn": "Complex numbers"
                },
                {
                    "display": "ℵ₀",
                    "code": "\\aleph_0",
                    "label": "Alef cero (cardinal infinito)",
                    "labelEn": "Aleph-null"
                },
                {
                    "display": "f: A → B",
                    "code": "f: A \\to B",
                    "label": "Definición de función",
                    "labelEn": "Function mapping"
                }
            ]
        }
    ],
    "geometria": [
        {
            "title": "Símbolos y Notación Geométrica",
            "titleEn": "Geometric Symbols & Notation",
            "items": [
                {
                    "display": "∠",
                    "code": "\\angle ABC",
                    "label": "Ángulo ABC",
                    "labelEn": "Angle ABC"
                },
                {
                    "display": "∡",
                    "code": "\\measuredangle",
                    "label": "Medida de ángulo",
                    "labelEn": "Measured angle"
                },
                {
                    "display": "°",
                    "code": "^\\circ",
                    "label": "Grados sexagesimales",
                    "labelEn": "Degree symbol"
                },
                {
                    "display": "∥",
                    "code": "\\parallel",
                    "label": "Paralelo a",
                    "labelEn": "Parallel to"
                },
                {
                    "display": "∦",
                    "code": "\\nparallel",
                    "label": "No paralelo a",
                    "labelEn": "Not parallel to"
                },
                {
                    "display": "⊥",
                    "code": "\\perp",
                    "label": "Perpendicular a",
                    "labelEn": "Perpendicular to"
                },
                {
                    "display": "≅",
                    "code": "\\cong",
                    "label": "Congruente",
                    "labelEn": "Congruent"
                },
                {
                    "display": "∼",
                    "code": "\\sim",
                    "label": "Semejante",
                    "labelEn": "Similar"
                },
                {
                    "display": "△",
                    "code": "\\triangle ABC",
                    "label": "Triángulo ABC",
                    "labelEn": "Triangle ABC"
                },
                {
                    "display": "AB̄",
                    "code": "\\overline{AB}",
                    "label": "Segmento AB",
                    "labelEn": "Line segment AB"
                },
                {
                    "display": "AB̂",
                    "code": "\\widehat{AB}",
                    "label": "Arco AB",
                    "labelEn": "Arc AB"
                },
                {
                    "display": "AB⃗",
                    "code": "\\vec{AB}",
                    "label": "Vector dirigido AB",
                    "labelEn": "Directed vector AB"
                }
            ]
        },
        {
            "title": "Trigonometría y Teoremas Fundamentales",
            "titleEn": "Trigonometry & Fundamental Theorems",
            "items": [
                {
                    "display": "Pitágoras",
                    "code": "a^2 + b^2 = c^2",
                    "label": "Teorema de Pitágoras",
                    "labelEn": "Pythagorean Theorem"
                },
                {
                    "display": "Teor. Seno",
                    "code": "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R",
                    "label": "Ley de senos",
                    "labelEn": "Law of Sines"
                },
                {
                    "display": "Teor. Coseno",
                    "code": "c^2 = a^2 + b^2 - 2ab\\cos C",
                    "label": "Ley de cosenos",
                    "labelEn": "Law of Cosines"
                },
                {
                    "display": "Área Triángulo",
                    "code": "\\text{Área} = \\frac{1}{2}ab\\sin C",
                    "label": "Área trigonométrica",
                    "labelEn": "Trigonometric area"
                },
                {
                    "display": "Herón",
                    "code": "A = \\sqrt{s(s-a)(s-b)(s-c)}",
                    "label": "Fórmula de Herón",
                    "labelEn": "Heron's Formula"
                },
                {
                    "display": "Recta punto-pend.",
                    "code": "y - y_0 = m(x - x_0)",
                    "label": "Ecuación punto-pendiente",
                    "labelEn": "Point-slope equation"
                },
                {
                    "display": "Dist. 2D",
                    "code": "d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}",
                    "label": "Distancia euclídea",
                    "labelEn": "Euclidean distance"
                },
                {
                    "display": "Circunferencia",
                    "code": "(x-h)^2 + (y-k)^2 = r^2",
                    "label": "Ecuación de la circunferencia",
                    "labelEn": "Circle equation"
                },
                {
                    "display": "Elipse",
                    "code": "\\frac{(x-h)^2}{a^2} + \\frac{(y-k)^2}{b^2} = 1",
                    "label": "Ecuación de la elipse",
                    "labelEn": "Ellipse equation"
                },
                {
                    "display": "Hipérbola",
                    "code": "\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1",
                    "label": "Ecuación de la hipérbola",
                    "labelEn": "Hyperbola equation"
                }
            ]
        }
    ],
    "cuantica": [
        {
            "title": "Notación Dirac (Bra - Ket)",
            "titleEn": "Dirac Notation (Bra - Ket)",
            "items": [
                {
                    "display": "|ψ⟩",
                    "code": "|\\psi\\rangle",
                    "label": "Ket estado",
                    "labelEn": "Ket state"
                },
                {
                    "display": "⟨ϕ|",
                    "code": "\\langle\\phi|",
                    "label": "Bra estado",
                    "labelEn": "Bra state"
                },
                {
                    "display": "⟨ϕ|ψ⟩",
                    "code": "\\langle\\phi | \\psi\\rangle",
                    "label": "Bra-Ket (producto interno)",
                    "labelEn": "Bra-Ket (inner product)"
                },
                {
                    "display": "⟨ϕ|Ĥ|ψ⟩",
                    "code": "\\langle\\phi| \\hat{H} |\\psi\\rangle",
                    "label": "Elemento matriz hamiltoniana",
                    "labelEn": "Matrix element"
                },
                {
                    "display": "⟨x|ψ⟩",
                    "code": "\\langle x | \\psi\\rangle",
                    "label": "Función de onda espacial",
                    "labelEn": "Wavefunction in position space"
                },
                {
                    "display": "|ψ⟩⟨ψ|",
                    "code": "|\\psi\\rangle\\langle\\psi|",
                    "label": "Operador proyector",
                    "labelEn": "Projection operator"
                },
                {
                    "display": "⟨Â⟩",
                    "code": "\\langle \\hat{A} \\rangle = \\langle\\psi| \\hat{A} |\\psi\\rangle",
                    "label": "Valor esperado",
                    "labelEn": "Expectation value"
                },
                {
                    "display": "|↑⟩",
                    "code": "|\\uparrow\\rangle",
                    "label": "Espín Up",
                    "labelEn": "Spin Up"
                },
                {
                    "display": "|↓⟩",
                    "code": "|\\downarrow\\rangle",
                    "label": "Espín Down",
                    "labelEn": "Spin Down"
                }
            ]
        },
        {
            "title": "Ecuaciones y Operadores Cuánticos",
            "titleEn": "Quantum Equations & Operators",
            "items": [
                {
                    "display": "Schrödinger",
                    "code": "i\\hbar \\frac{\\partial}{\\partial t}|\\psi(t)\\rangle = \\hat{H}|\\psi(t)\\rangle",
                    "label": "Ec. Schrödinger temporal",
                    "labelEn": "Time-dependent Schrödinger eq."
                },
                {
                    "display": "H|ψ⟩=E|ψ⟩",
                    "code": "\\hat{H}|\\psi\\rangle = E|\\psi\\rangle",
                    "label": "Ec. Schrödinger independiente",
                    "labelEn": "Time-independent Schrödinger eq."
                },
                {
                    "display": "p̂=-iℏ∇",
                    "code": "\\hat{p} = -i\\hbar \\nabla",
                    "label": "Operador momento",
                    "labelEn": "Momentum operator"
                },
                {
                    "display": "[Â, B̂]",
                    "code": "[\\hat{A}, \\hat{B}] = \\hat{A}\\hat{B} - \\hat{B}\\hat{A}",
                    "label": "Conmutador",
                    "labelEn": "Commutator"
                },
                {
                    "display": "{Â, B̂}",
                    "code": "\\{\\hat{A}, \\hat{B}\\} = \\hat{A}\\hat{B} + \\hat{B}\\hat{A}",
                    "label": "Anticonmutador",
                    "labelEn": "Anticommutator"
                },
                {
                    "display": "ΔxΔp≥ℏ/2",
                    "code": "\\Delta x \\, \\Delta p \\ge \\frac{\\hbar}{2}",
                    "label": "Principio de Incertidumbre",
                    "labelEn": "Uncertainty Principle"
                },
                {
                    "display": "â†, â",
                    "code": "\\hat{a}^\\dagger, \\hat{a}",
                    "label": "Creación y Aniquilación",
                    "labelEn": "Creation & annihilation ops"
                },
                {
                    "display": "N̂=â†â",
                    "code": "\\hat{N} = \\hat{a}^\\dagger \\hat{a}",
                    "label": "Operador Número",
                    "labelEn": "Number operator"
                },
                {
                    "display": "Matriz ρ",
                    "code": "\\rho = \\sum_{i} p_i |\\psi_i\\rangle\\langle\\psi_i|",
                    "label": "Matriz densidad",
                    "labelEn": "Density matrix"
                }
            ]
        },
        {
            "title": "Electromagnetismo y Ecuaciones de Maxwell",
            "titleEn": "Electromagnetism & Maxwell's Equations",
            "items": [
                {
                    "display": "∇·E=ρ/ε₀",
                    "code": "\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}",
                    "label": "Ley de Gauss (eléctrica)",
                    "labelEn": "Gauss's Law (electric)"
                },
                {
                    "display": "∇·B=0",
                    "code": "\\nabla \\cdot \\vec{B} = 0",
                    "label": "Ley de Gauss (magnética)",
                    "labelEn": "Gauss's Law (magnetic)"
                },
                {
                    "display": "∇×E=-∂B/∂t",
                    "code": "\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}",
                    "label": "Ley de Faraday",
                    "labelEn": "Faraday's Law"
                },
                {
                    "display": "∇×B=μ₀J+μ₀ε₀∂E/∂t",
                    "code": "\\nabla \\times \\vec{B} = \\mu_0 \\vec{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}",
                    "label": "Ley de Ampère-Maxwell",
                    "labelEn": "Ampère-Maxwell Law"
                },
                {
                    "display": "Lorentz",
                    "code": "\\vec{F} = q(\\vec{E} + \\vec{v} \\times \\vec{B})",
                    "label": "Fuerza de Lorentz",
                    "labelEn": "Lorentz force"
                }
            ]
        },
        {
            "title": "Relatividad, Termodinámica y Constantes",
            "titleEn": "Relativity, Thermodynamics & Constants",
            "items": [
                {
                    "display": "ds²",
                    "code": "ds^2 = -c^2 dt^2 + dx^2 + dy^2 + dz^2",
                    "label": "Métrica de Minkowski",
                    "labelEn": "Minkowski metric"
                },
                {
                    "display": "g_μν",
                    "code": "g_{\\mu\\nu}",
                    "label": "Tensor métrico",
                    "labelEn": "Metric tensor"
                },
                {
                    "display": "∂_μ",
                    "code": "\\partial_\\mu",
                    "label": "Cuadrivector gradiente",
                    "labelEn": "4-gradient"
                },
                {
                    "display": "E=mc²",
                    "code": "E = mc^2",
                    "label": "Equivalencia masa-energía",
                    "labelEn": "Mass-energy equivalence"
                },
                {
                    "display": "E²=(pc)²+(m₀c²)²",
                    "code": "E^2 = (pc)^2 + (m_0 c^2)^2",
                    "label": "Relación dispersión relativista",
                    "labelEn": "Relativistic dispersion"
                },
                {
                    "display": "dU=TdS-PdV",
                    "code": "dU = T\\,dS - P\\,dV",
                    "label": "Primera Ley Termodinámica",
                    "labelEn": "First Law of Thermodynamics"
                },
                {
                    "display": "dG=-SdT+VdP",
                    "code": "dG = -S\\,dT + V\\,dP",
                    "label": "Energía Libre de Gibbs",
                    "labelEn": "Gibbs Free Energy"
                },
                {
                    "display": "S=k_B ln Ω",
                    "code": "S = k_B \\ln \\Omega",
                    "label": "Entropía de Boltzmann",
                    "labelEn": "Boltzmann entropy"
                },
                {
                    "display": "ℏ",
                    "code": "\\hbar",
                    "label": "Constante de Planck reducida",
                    "labelEn": "Reduced Planck constant"
                },
                {
                    "display": "k_B",
                    "code": "k_B",
                    "label": "Constante de Boltzmann",
                    "labelEn": "Boltzmann constant"
                },
                {
                    "display": "ε₀, μ₀",
                    "code": "\\varepsilon_0, \\mu_0",
                    "label": "Permitividad y permeabilidad del vacío",
                    "labelEn": "Vacuum permittivity & permeability"
                },
                {
                    "display": "Unidades: m/s², eV, Ω",
                    "code": "\\text{m/s}^2, \\text{eV}, \\Omega",
                    "label": "Unidades SI y físicas",
                    "labelEn": "SI & physics units"
                }
            ]
        }
    ],
    "quimica": [
        {
            "title": "Fórmulas Químicas e Iones Comunes",
            "titleEn": "Chemical Formulas & Common Ions",
            "items": [
                {
                    "display": "H₂O",
                    "code": "\\text{H}_2\\text{O}",
                    "label": "Agua",
                    "labelEn": "Water"
                },
                {
                    "display": "CO₂",
                    "code": "\\text{CO}_2",
                    "label": "Dióxido de carbono",
                    "labelEn": "Carbon dioxide"
                },
                {
                    "display": "H₂SO₄",
                    "code": "\\text{H}_2\\text{SO}_4",
                    "label": "Ácido sulfúrico",
                    "labelEn": "Sulfuric acid"
                },
                {
                    "display": "HCl",
                    "code": "\\text{HCl}",
                    "label": "Ácido clorhídrico",
                    "labelEn": "Hydrochloric acid"
                },
                {
                    "display": "HNO₃",
                    "code": "\\text{HNO}_3",
                    "label": "Ácido nítrico",
                    "labelEn": "Nitric acid"
                },
                {
                    "display": "NaOH",
                    "code": "\\text{NaOH}",
                    "label": "Hidróxido de sodio",
                    "labelEn": "Sodium hydroxide"
                },
                {
                    "display": "NH₄⁺",
                    "code": "\\text{NH}_4^+",
                    "label": "Ion amonio",
                    "labelEn": "Ammonium ion"
                },
                {
                    "display": "SO₄²⁻",
                    "code": "\\text{SO}_4^{2-}",
                    "label": "Ion sulfato",
                    "labelEn": "Sulfate ion"
                },
                {
                    "display": "NO₃⁻",
                    "code": "\\text{NO}_3^-",
                    "label": "Ion nitrato",
                    "labelEn": "Nitrate ion"
                },
                {
                    "display": "CO₃²⁻",
                    "code": "\\text{CO}_3^{2-}",
                    "label": "Ion carbonato",
                    "labelEn": "Carbonate ion"
                },
                {
                    "display": "H₃O⁺",
                    "code": "\\text{H}_3\\text{O}^+",
                    "label": "Ion hidronio",
                    "labelEn": "Hydronium ion"
                },
                {
                    "display": "OH⁻",
                    "code": "\\text{OH}^-",
                    "label": "Ion hidróxido",
                    "labelEn": "Hydroxide ion"
                }
            ]
        },
        {
            "title": "Flechas de Reacción y Estados",
            "titleEn": "Reaction Arrows & Aggregation States",
            "items": [
                {
                    "display": "⟶",
                    "code": "\\longrightarrow",
                    "label": "Reacción irreversible",
                    "labelEn": "Forward reaction"
                },
                {
                    "display": "⇌",
                    "code": "\\rightleftharpoons",
                    "label": "Equilibrio dinámico",
                    "labelEn": "Chemical equilibrium"
                },
                {
                    "display": "⟵",
                    "code": "\\longleftarrow",
                    "label": "Reacción inversa",
                    "labelEn": "Reverse reaction"
                },
                {
                    "display": "─Δ→",
                    "code": "\\xrightarrow{\\Delta}",
                    "label": "Reacción con calor",
                    "labelEn": "Reaction with heat"
                },
                {
                    "display": "─cat→",
                    "code": "\\xrightarrow{\\text{cat.}}",
                    "label": "Reacción catalizada",
                    "labelEn": "Catalyzed reaction"
                },
                {
                    "display": "─hν→",
                    "code": "\\xrightarrow{h\\nu}",
                    "label": "Reacción fotoquímica (luz)",
                    "labelEn": "Photochemical reaction"
                },
                {
                    "display": "↑ (gas)",
                    "code": "\\uparrow",
                    "label": "Desprendimiento gaseoso",
                    "labelEn": "Gas evolution"
                },
                {
                    "display": "↓ (prec.)",
                    "code": "\\downarrow",
                    "label": "Precipitado sólido",
                    "labelEn": "Precipitate formation"
                },
                {
                    "display": "(s), (l), (g), (aq)",
                    "code": "\\text{(s)}, \\text{(l)}, \\text{(g)}, \\text{(aq)}",
                    "label": "Estados de agregación",
                    "labelEn": "States of matter"
                }
            ]
        },
        {
            "title": "Equilibrio, pH y Termoquímica",
            "titleEn": "Equilibrium, pH & Thermochemistry",
            "items": [
                {
                    "display": "pH = -log[H₃O⁺]",
                    "code": "\\text{pH} = -\\log[\\text{H}_3\\text{O}^+]",
                    "label": "Definición de pH",
                    "labelEn": "pH definition"
                },
                {
                    "display": "pOH = -log[OH⁻]",
                    "code": "\\text{pOH} = -\\log[\\text{OH}^-]",
                    "label": "Definición de pOH",
                    "labelEn": "pOH definition"
                },
                {
                    "display": "pH + pOH = 14",
                    "code": "\\text{pH} + \\text{pOH} = 14",
                    "label": "Producto iónico del agua",
                    "labelEn": "Water ion product"
                },
                {
                    "display": "Ka (acidez)",
                    "code": "K_a = \\frac{[\\text{H}^+][\\text{A}^-]}{[\\text{HA}]}",
                    "label": "Constante de acidez Ka",
                    "labelEn": "Acid dissociation constant Ka"
                },
                {
                    "display": "Henderson-Hasselbalch",
                    "code": "\\text{pH} = \\text{p}K_a + \\log\\frac{[\\text{A}^-]}{[\\text{HA}]}",
                    "label": "Ecuación buffer",
                    "labelEn": "Henderson-Hasselbalch eq."
                },
                {
                    "display": "ΔG = ΔH - TΔS",
                    "code": "\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ",
                    "label": "Energía libre de Gibbs estándar",
                    "labelEn": "Standard Gibbs free energy"
                },
                {
                    "display": "ΔG° = -RT ln K",
                    "code": "\\Delta G^\\circ = -RT \\ln K_{eq}",
                    "label": "Gibbs y constante equilibrio",
                    "labelEn": "Gibbs & equilibrium constant"
                },
                {
                    "display": "Arrhenius",
                    "code": "k = A e^{-\\frac{E_a}{RT}}",
                    "label": "Ecuación de Arrhenius (cinética)",
                    "labelEn": "Arrhenius equation"
                },
                {
                    "display": "PV = nRT",
                    "code": "P V = n R T",
                    "label": "Ley de gases ideales",
                    "labelEn": "Ideal gas law"
                },
                {
                    "display": "Van der Waals",
                    "code": "\\left(P + \\frac{a n^2}{V^2}\\right)(V - n b) = n R T",
                    "label": "Ecuación de Van der Waals",
                    "labelEn": "Van der Waals equation"
                }
            ]
        },
        {
            "title": "Isótopos y Configuración Electrónica",
            "titleEn": "Isotopes & Electron Configuration",
            "items": [
                {
                    "display": "¹⁴₆C",
                    "code": "^{14}_{6}\\text{C}",
                    "label": "Isótopo Carbono-14",
                    "labelEn": "Carbon-14 isotope"
                },
                {
                    "display": "²³⁵₉₂U",
                    "code": "^{235}_{92}\\text{U}",
                    "label": "Isótopo Uranio-235",
                    "labelEn": "Uranium-235 isotope"
                },
                {
                    "display": "¹₁H, ²₁H",
                    "code": "^{1}_{1}\\text{H}, ^{2}_{1}\\text{H}",
                    "label": "Protio y Deuterio",
                    "labelEn": "Protium & Deuterium"
                },
                {
                    "display": "1s² 2s² 2p⁶",
                    "code": "1s^2 2s^2 2p^6",
                    "label": "Configuración orbital Neón",
                    "labelEn": "Neon electron config"
                },
                {
                    "display": "E = hν = hc/λ",
                    "code": "\\Delta E = h\\nu = \\frac{hc}{\\lambda}",
                    "label": "Energía de fotón / transición",
                    "labelEn": "Photon energy / transition"
                }
            ]
        }
    ],
    "biologia": [
        {
            "title": "Cinética Enzimática y Bioquímica",
            "titleEn": "Enzyme Kinetics & Biochemistry",
            "items": [
                {
                    "display": "Michaelis-Menten",
                    "code": "v_0 = \\frac{V_{\\max}[S]}{K_m + [S]}",
                    "label": "Cinética de Michaelis-Menten",
                    "labelEn": "Michaelis-Menten kinetics"
                },
                {
                    "display": "Lineweaver-Burk",
                    "code": "\\frac{1}{v_0} = \\frac{K_m}{V_{\\max}}\\frac{1}{[S]} + \\frac{1}{V_{\\max}}",
                    "label": "Doble recíproco Lineweaver-Burk",
                    "labelEn": "Lineweaver-Burk plot"
                },
                {
                    "display": "Ec. Hill",
                    "code": "\\theta = \\frac{[L]^n}{K_d + [L]^n}",
                    "label": "Cooperatividad alostérica de Hill",
                    "labelEn": "Hill equation for binding"
                },
                {
                    "display": "ATP ⇌ ADP + Pi",
                    "code": "\\text{ATP} + \\text{H}_2\\text{O} \\rightleftharpoons \\text{ADP} + \\text{P}_i + \\text{H}^+",
                    "label": "Hidrólisis de ATP celular",
                    "labelEn": "ATP hydrolysis"
                },
                {
                    "display": "ΔG'° (ATP)",
                    "code": "\\Delta G'^{\\circ} = -30.5 \\text{ kJ/mol}",
                    "label": "Energía libre hidrólisis ATP",
                    "labelEn": "ATP free energy of hydrolysis"
                }
            ]
        },
        {
            "title": "Genética y Evolución de Poblaciones",
            "titleEn": "Genetics & Population Evolution",
            "items": [
                {
                    "display": "Hardy-Weinberg",
                    "code": "p^2 + 2pq + q^2 = 1",
                    "label": "Equilibrio de Hardy-Weinberg",
                    "labelEn": "Hardy-Weinberg equilibrium"
                },
                {
                    "display": "p + q = 1",
                    "code": "p + q = 1",
                    "label": "Frecuencias alélicas",
                    "labelEn": "Allele frequencies"
                },
                {
                    "display": "ADN 5' → 3'",
                    "code": "5'\\text{ - ATGCGAT - }3'",
                    "label": "Direccionalidad hebra ADN/ARN",
                    "labelEn": "5' to 3' DNA/RNA direction"
                },
                {
                    "display": "Recombinación cM",
                    "code": "\\text{Frecuencia de recombinación} = \\frac{\\text{Recombinantes}}{\\text{Total}} \\times 100\\%",
                    "label": "Distancia genética en cM",
                    "labelEn": "Recombination frequency"
                }
            ]
        },
        {
            "title": "Ecología y Dinámica de Poblaciones",
            "titleEn": "Ecology & Population Dynamics",
            "items": [
                {
                    "display": "Crec. Exponencial",
                    "code": "\\frac{dN}{dt} = r N",
                    "label": "Crecimiento poblacional maltusiano",
                    "labelEn": "Exponential growth"
                },
                {
                    "display": "Crec. Logístico",
                    "code": "\\frac{dN}{dt} = r N \\left(1 - \\frac{N}{K}\\right)",
                    "label": "Crecimiento logístico con capacidad K",
                    "labelEn": "Logistic population growth"
                },
                {
                    "display": "Lotka-Volterra Presas",
                    "code": "\\frac{dx}{dt} = \\alpha x - \\beta x y",
                    "label": "Ecuación presa Lotka-Volterra",
                    "labelEn": "Lotka-Volterra prey equation"
                },
                {
                    "display": "Lotka-Volterra Depr.",
                    "code": "\\frac{dy}{dt} = \\delta x y - \\gamma y",
                    "label": "Ecuación depredador Lotka-Volterra",
                    "labelEn": "Lotka-Volterra predator equation"
                },
                {
                    "display": "Índice Shannon H'",
                    "code": "H' = -\\sum_{i=1}^{S} p_i \\ln p_i",
                    "label": "Índice diversidad ecológica de Shannon",
                    "labelEn": "Shannon diversity index"
                },
                {
                    "display": "Índice Simpson D",
                    "code": "D = \\sum_{i=1}^{S} p_i^2",
                    "label": "Índice dominancia de Simpson",
                    "labelEn": "Simpson dominance index"
                }
            ]
        },
        {
            "title": "Fisiología y Biofísica Celular",
            "titleEn": "Physiology & Cellular Biophysics",
            "items": [
                {
                    "display": "Ec. Nernst",
                    "code": "E_m = \\frac{RT}{zF} \\ln \\frac{[\\text{Ion}]_{out}}{[\\text{Ion}]_{in}}",
                    "label": "Potencial de equilibrio Nernst",
                    "labelEn": "Nernst equilibrium potential"
                },
                {
                    "display": "Nernst 37°C",
                    "code": "E_m = \\frac{61.5}{z} \\log_{10} \\frac{[\\text{Ion}]_{out}}{[\\text{Ion}]_{in}} \\text{ mV}",
                    "label": "Nernst a temperatura corporal",
                    "labelEn": "Nernst at body temperature"
                },
                {
                    "display": "Goldman-Hodgkin-Katz",
                    "code": "V_m = \\frac{RT}{F}\\ln \\frac{P_{\\text{K}}[\\text{K}^+]_o + P_{\\text{Na}}[\\text{Na}^+]_o + P_{\\text{Cl}}[\\text{Cl}^-]_i}{P_{\\text{K}}[\\text{K}^+]_i + P_{\\text{Na}}[\\text{Na}^+]_i + P_{\\text{Cl}}[\\text{Cl}^-]_o}",
                    "label": "Potencial de membrana GHK",
                    "labelEn": "Goldman-Hodgkin-Katz eq."
                },
                {
                    "display": "Ley de Fick",
                    "code": "J = -D \\frac{dC}{dx}",
                    "label": "Primera Ley de difusión de Fick",
                    "labelEn": "Fick's first law of diffusion"
                }
            ]
        }
    ],
    "griegas": [
        {
            "title": "Letras Griegas (Minúsculas)",
            "titleEn": "Greek Letters (Lowercase)",
            "items": [
                {
                    "display": "α",
                    "code": "\\alpha",
                    "label": "alpha",
                    "labelEn": "alpha"
                },
                {
                    "display": "β",
                    "code": "\\beta",
                    "label": "beta",
                    "labelEn": "beta"
                },
                {
                    "display": "γ",
                    "code": "\\gamma",
                    "label": "gamma",
                    "labelEn": "gamma"
                },
                {
                    "display": "δ",
                    "code": "\\delta",
                    "label": "delta",
                    "labelEn": "delta"
                },
                {
                    "display": "ε",
                    "code": "\\varepsilon",
                    "label": "epsilon (variante)",
                    "labelEn": "epsilon (var)"
                },
                {
                    "display": "ϵ",
                    "code": "\\epsilon",
                    "label": "epsilon",
                    "labelEn": "epsilon"
                },
                {
                    "display": "ζ",
                    "code": "\\zeta",
                    "label": "zeta",
                    "labelEn": "zeta"
                },
                {
                    "display": "η",
                    "code": "\\eta",
                    "label": "eta",
                    "labelEn": "eta"
                },
                {
                    "display": "θ",
                    "code": "\\theta",
                    "label": "theta",
                    "labelEn": "theta"
                },
                {
                    "display": "ϑ",
                    "code": "\\vartheta",
                    "label": "theta (variante)",
                    "labelEn": "theta (var)"
                },
                {
                    "display": "ι",
                    "code": "\\iota",
                    "label": "iota",
                    "labelEn": "iota"
                },
                {
                    "display": "κ",
                    "code": "\\kappa",
                    "label": "kappa",
                    "labelEn": "kappa"
                },
                {
                    "display": "λ",
                    "code": "\\lambda",
                    "label": "lambda",
                    "labelEn": "lambda"
                },
                {
                    "display": "μ",
                    "code": "\\mu",
                    "label": "mu",
                    "labelEn": "mu"
                },
                {
                    "display": "ν",
                    "code": "\\nu",
                    "label": "nu",
                    "labelEn": "nu"
                },
                {
                    "display": "ξ",
                    "code": "\\xi",
                    "label": "xi",
                    "labelEn": "xi"
                },
                {
                    "display": "π",
                    "code": "\\pi",
                    "label": "pi",
                    "labelEn": "pi"
                },
                {
                    "display": "ϖ",
                    "code": "\\varpi",
                    "label": "pi (variante)",
                    "labelEn": "pi (var)"
                },
                {
                    "display": "ρ",
                    "code": "\\rho",
                    "label": "rho",
                    "labelEn": "rho"
                },
                {
                    "display": "ϱ",
                    "code": "\\varrho",
                    "label": "rho (variante)",
                    "labelEn": "rho (var)"
                },
                {
                    "display": "σ",
                    "code": "\\sigma",
                    "label": "sigma",
                    "labelEn": "sigma"
                },
                {
                    "display": "ς",
                    "code": "\\varsigma",
                    "label": "sigma final",
                    "labelEn": "final sigma"
                },
                {
                    "display": "τ",
                    "code": "\\tau",
                    "label": "tau",
                    "labelEn": "tau"
                },
                {
                    "display": "υ",
                    "code": "\\upsilon",
                    "label": "upsilon",
                    "labelEn": "upsilon"
                },
                {
                    "display": "φ",
                    "code": "\\varphi",
                    "label": "phi (variante)",
                    "labelEn": "phi (var)"
                },
                {
                    "display": "ϕ",
                    "code": "\\phi",
                    "label": "phi",
                    "labelEn": "phi"
                },
                {
                    "display": "χ",
                    "code": "\\chi",
                    "label": "chi",
                    "labelEn": "chi"
                },
                {
                    "display": "ψ",
                    "code": "\\psi",
                    "label": "psi",
                    "labelEn": "psi"
                },
                {
                    "display": "ω",
                    "code": "\\omega",
                    "label": "omega",
                    "labelEn": "omega"
                }
            ]
        },
        {
            "title": "Letras Griegas (Mayúsculas)",
            "titleEn": "Greek Letters (Uppercase)",
            "items": [
                {
                    "display": "Γ",
                    "code": "\\Gamma",
                    "label": "Gamma",
                    "labelEn": "Gamma"
                },
                {
                    "display": "Δ",
                    "code": "\\Delta",
                    "label": "Delta",
                    "labelEn": "Delta"
                },
                {
                    "display": "Θ",
                    "code": "\\Theta",
                    "label": "Theta",
                    "labelEn": "Theta"
                },
                {
                    "display": "Λ",
                    "code": "\\Lambda",
                    "label": "Lambda",
                    "labelEn": "Lambda"
                },
                {
                    "display": "Ξ",
                    "code": "\\Xi",
                    "label": "Xi",
                    "labelEn": "Xi"
                },
                {
                    "display": "Π",
                    "code": "\\Pi",
                    "label": "Pi",
                    "labelEn": "Pi"
                },
                {
                    "display": "Σ",
                    "code": "\\Sigma",
                    "label": "Sigma",
                    "labelEn": "Sigma"
                },
                {
                    "display": "Υ",
                    "code": "\\Upsilon",
                    "label": "Upsilon",
                    "labelEn": "Upsilon"
                },
                {
                    "display": "Φ",
                    "code": "\\Phi",
                    "label": "Phi",
                    "labelEn": "Phi"
                },
                {
                    "display": "Ψ",
                    "code": "\\Psi",
                    "label": "Psi",
                    "labelEn": "Psi"
                },
                {
                    "display": "Ω",
                    "code": "\\Omega",
                    "label": "Omega",
                    "labelEn": "Omega"
                }
            ]
        },
        {
            "title": "Acentos y Modificadores Matemáticos",
            "titleEn": "Accents & Modifiers",
            "items": [
                {
                    "display": "x̂",
                    "code": "\\hat{x}",
                    "label": "Acento circunflejo (sombrero)",
                    "labelEn": "Hat accent"
                },
                {
                    "display": "x̃",
                    "code": "\\tilde{x}",
                    "label": "Tilde",
                    "labelEn": "Tilde"
                },
                {
                    "display": "x̄",
                    "code": "\\bar{x}",
                    "label": "Barra superior",
                    "labelEn": "Overbar"
                },
                {
                    "display": "x⃗",
                    "code": "\\vec{x}",
                    "label": "Vector flecha",
                    "labelEn": "Vector arrow"
                },
                {
                    "display": "ẋ",
                    "code": "\\dot{x}",
                    "label": "Punto temporal (derivada)",
                    "labelEn": "Time dot derivative"
                },
                {
                    "display": "ẍ",
                    "code": "\\ddot{x}",
                    "label": "Doble punto temporal",
                    "labelEn": "Double dot derivative"
                },
                {
                    "display": "x̌",
                    "code": "\\check{x}",
                    "label": "Carón / Check",
                    "labelEn": "Caron / Check"
                },
                {
                    "display": "x̆",
                    "code": "\\breve{x}",
                    "label": "Breve",
                    "labelEn": "Breve"
                },
                {
                    "display": "x́",
                    "code": "\\acute{x}",
                    "label": "Acento agudo",
                    "labelEn": "Acute accent"
                },
                {
                    "display": "x̀",
                    "code": "\\grave{x}",
                    "label": "Acento grave",
                    "labelEn": "Grave accent"
                },
                {
                    "display": "x*",
                    "code": "x^*",
                    "label": "Complejo conjugado",
                    "labelEn": "Complex conjugate"
                },
                {
                    "display": "x†",
                    "code": "x^\\dagger",
                    "label": "Adjunto hermítico",
                    "labelEn": "Hermitian adjoint"
                }
            ]
        },
        {
            "title": "Flechas y Direccionales",
            "titleEn": "Arrows & Directionals",
            "items": [
                {
                    "display": "→",
                    "code": "\\to",
                    "label": "Flecha a la derecha",
                    "labelEn": "Right arrow"
                },
                {
                    "display": "←",
                    "code": "\\leftarrow",
                    "label": "Flecha a la izquierda",
                    "labelEn": "Left arrow"
                },
                {
                    "display": "↔",
                    "code": "\\leftrightarrow",
                    "label": "Flecha bidireccional",
                    "labelEn": "Bidirectional arrow"
                },
                {
                    "display": "⇒",
                    "code": "\\implies",
                    "label": "Implica lógicamente",
                    "labelEn": "Implies"
                },
                {
                    "display": "⇐",
                    "code": "\\Leftarrow",
                    "label": "Implicación inversa",
                    "labelEn": "Reverse implication"
                },
                {
                    "display": "⇔",
                    "code": "\\iff",
                    "label": "Si y solo si (equivalencia)",
                    "labelEn": "If and only if"
                },
                {
                    "display": "↦",
                    "code": "\\mapsto",
                    "label": "Asigna a (maps to)",
                    "labelEn": "Maps to"
                },
                {
                    "display": "↪",
                    "code": "\\hookrightarrow",
                    "label": "Inclusión / Inyección",
                    "labelEn": "Inclusion / Injection"
                },
                {
                    "display": "↑",
                    "code": "\\uparrow",
                    "label": "Flecha arriba",
                    "labelEn": "Up arrow"
                },
                {
                    "display": "↓",
                    "code": "\\downarrow",
                    "label": "Flecha abajo",
                    "labelEn": "Down arrow"
                },
                {
                    "display": "↕",
                    "code": "\\updownarrow",
                    "label": "Flecha vertical doble",
                    "labelEn": "Up-down arrow"
                }
            ]
        }
    ]
};

// Aliases para compatibilidad hacia atrás y soporte multilingüe
mathDatabase.calculo = mathDatabase.calculus;
mathDatabase["cálculo"] = mathDatabase.calculus;
mathDatabase.analisis = mathDatabase.calculus;
mathDatabase["análisis"] = mathDatabase.calculus;
mathDatabase["álgebra"] = mathDatabase.algebra;
mathDatabase.basico = mathDatabase.algebra;
mathDatabase["básico"] = mathDatabase.algebra;
mathDatabase.matriz = mathDatabase.matrices;
mathDatabase.lineal = mathDatabase.matrices;
mathDatabase["estadística"] = mathDatabase.estadistica;
mathDatabase.probabilidad = mathDatabase.estadistica;
mathDatabase.statistics = mathDatabase.estadistica;
mathDatabase["lógica"] = mathDatabase.logica;
mathDatabase.conjuntos = mathDatabase.logica;
mathDatabase.logic = mathDatabase.logica;
mathDatabase["geometría"] = mathDatabase.geometria;
mathDatabase.trigonometria = mathDatabase.geometria;
mathDatabase["trigonometría"] = mathDatabase.geometria;
mathDatabase.geometry = mathDatabase.geometria;
mathDatabase["cuántica"] = mathDatabase.cuantica;
mathDatabase.fisica = mathDatabase.cuantica;
mathDatabase["física"] = mathDatabase.cuantica;
mathDatabase.quantum = mathDatabase.cuantica;
mathDatabase.physics = mathDatabase.cuantica;
mathDatabase["química"] = mathDatabase.quimica;
mathDatabase.chemistry = mathDatabase.quimica;
mathDatabase["biología"] = mathDatabase.biologia;
mathDatabase.bioquimica = mathDatabase.biologia;
mathDatabase["bioquímica"] = mathDatabase.biologia;
mathDatabase.biology = mathDatabase.biologia;
mathDatabase.simbolos = mathDatabase.griegas;
mathDatabase["símbolos"] = mathDatabase.griegas;
mathDatabase.greek = mathDatabase.griegas;

// Exportación global de la base de datos de fórmulas
window.mathDatabase = mathDatabase;

// Metadatos de navegación de categorías científicas
const MATH_CATEGORIES_META = [
    { id: 'algebra', icon: '📐', nameEs: 'Básico & Álgebra', nameEn: 'Basic & Algebra' },
    { id: 'calculus', icon: '📈', nameEs: 'Cálculo & Análisis', nameEn: 'Calculus & Analysis' },
    { id: 'matrices', icon: '🔢', nameEs: 'Matrices & Álgebra Lineal', nameEn: 'Matrices & Linear' },
    { id: 'estadistica', icon: '📊', nameEs: 'Estadística & Prob.', nameEn: 'Statistics & Prob.' },
    { id: 'logica', icon: '💡', nameEs: 'Lógica & Conjuntos', nameEn: 'Logic & Sets' },
    { id: 'geometria', icon: '📏', nameEs: 'Geometría & Trig.', nameEn: 'Geometry & Trig' },
    { id: 'cuantica', icon: '⚛️', nameEs: 'Física & Cuántica', nameEn: 'Physics & Quantum' },
    { id: 'quimica', icon: '🧪', nameEs: 'Química', nameEn: 'Chemistry' },
    { id: 'biologia', icon: '🧬', nameEs: 'Biología & Biofísica', nameEn: 'Biology & Biophysics' },
    { id: 'griegas', icon: '𝛂', nameEs: 'Griegas & Símbolos', nameEn: 'Greek & Symbols' }
];

// Estado del teclado matemático
let mathCurrentCategory = 'algebra';
let mathCurrentMode = 'inline'; // 'inline' | 'display' | 'equation'
let mathHistoryStack = [];
let mathHistoryIndex = -1;

/**
 * Registra el estado actual de la fórmula para deshacer/rehacer
 */
function recordMathHistory() {
    const formulaInput = document.getElementById('mathFormulaInput');
    if (!formulaInput) return;
    if (mathHistoryIndex < mathHistoryStack.length - 1) {
        mathHistoryStack = mathHistoryStack.slice(0, mathHistoryIndex + 1);
    }
    mathHistoryStack.push(formulaInput.value);
    mathHistoryIndex++;
    if (mathHistoryStack.length > 50) {
        mathHistoryStack.shift();
        mathHistoryIndex--;
    }
}

/**
 * Renderiza la vista previa KaTeX en vivo dentro del modal
 */
function renderMathFormulaLive() {
    const formulaPreview = document.getElementById('mathFormulaPreview');
    const formulaInput = document.getElementById('mathFormulaInput');
    const renderStatus = document.getElementById('mathRenderStatus');
    if (!formulaPreview || !formulaInput) return;

    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const code = formulaInput.value.trim();

    if (!code) {
        const emptyHint = isEn 
            ? '✨ Click on symbols or type LaTeX to see live preview...' 
            : '✨ Haz clic en los símbolos o escribe para ver la vista previa en vivo...';
        formulaPreview.innerHTML = `<span class="math-preview-empty-hint">${emptyHint}</span>`;
        if (renderStatus) {
            renderStatus.innerText = 'KaTeX ✓';
            renderStatus.style.color = 'var(--success, #10B981)';
        }
        return;
    }

    if (window.katex) {
        try {
            window.katex.render(code, formulaPreview, {
                displayMode: mathCurrentMode !== 'inline',
                throwOnError: false,
                errorColor: '#EF4444'
            });
            if (renderStatus) {
                renderStatus.innerText = 'KaTeX ✓';
                renderStatus.style.color = 'var(--success, #10B981)';
            }
        } catch (e) {
            if (renderStatus) {
                renderStatus.innerText = isEn ? 'Typing...' : 'Escribiendo...';
                renderStatus.style.color = 'var(--fox-orange, #FF6B35)';
            }
        }
    } else {
        const safe = typeof escapeHtml === 'function' ? escapeHtml(code) : code;
        formulaPreview.innerHTML = `<code>${safe}</code>`;
    }
}

/**
 * Inserta código LaTeX en el textarea de fórmula en la posición del cursor
 */
function insertIntoFormula(codeSnippet, cursorOffset) {
    const formulaInput = document.getElementById('mathFormulaInput');
    if (!formulaInput) return;
    recordMathHistory();

    const start = formulaInput.selectionStart;
    const end = formulaInput.selectionEnd;
    const val = formulaInput.value;
    const before = val.substring(0, start);
    const after = val.substring(end);

    const needsSpaceBefore = before.length > 0 && 
        !before.endsWith(' ') && 
        !before.endsWith('{') && 
        !before.endsWith('(') && 
        !before.endsWith('[') && 
        !before.endsWith('^') && 
        !before.endsWith('_') && 
        !codeSnippet.startsWith('^') && 
        !codeSnippet.startsWith('_');

    const insertion = (needsSpaceBefore ? ' ' : '') + codeSnippet;
    formulaInput.value = before + insertion + after;

    const offset = cursorOffset !== undefined ? (needsSpaceBefore ? 1 : 0) + cursorOffset : insertion.length;
    const newPos = start + offset;

    formulaInput.focus();
    formulaInput.setSelectionRange(newPos, newPos);

    renderMathFormulaLive();
}

/**
 * Renderiza dinámicamente las pestañas de categorías en #mathCategoryTabs
 */
function renderMathCategoryTabs() {
    const tabsContainer = document.getElementById('mathCategoryTabs');
    if (!tabsContainer) return;

    tabsContainer.style.display = 'grid';
    tabsContainer.style.gridTemplateColumns = 'repeat(5, 1fr)';
    tabsContainer.style.gap = '6px';
    tabsContainer.style.width = '100%';
    tabsContainer.style.overflowX = 'visible';

    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    tabsContainer.innerHTML = '';

    MATH_CATEGORIES_META.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'math-cat-btn' + (cat.id === mathCurrentCategory ? ' active' : '');
        btn.setAttribute('data-cat', cat.id);
        btn.style.padding = '6px 8px';
        btn.style.fontSize = '12px';

        const label = isEn ? cat.nameEn : cat.nameEs;
        btn.innerHTML = `<span>${cat.icon}</span> <span>${label}</span>`;

        btn.onclick = (e) => {
            e.preventDefault();
            tabsContainer.querySelectorAll('.math-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mathCurrentCategory = cat.id;
            const searchInput = document.getElementById('mathSearchInput');
            if (searchInput) searchInput.value = '';
            renderCategory(cat.id);
        };

        tabsContainer.appendChild(btn);
    });
}

/**
 * Renderiza la grilla de símbolos para una categoría o término de búsqueda
 */
function renderCategory(cat, query = '') {
    mathCurrentCategory = cat;
    const bodyContainer = document.getElementById('mathBody');
    if (!bodyContainer) return;
    bodyContainer.innerHTML = '';
    const q = query.trim().toLowerCase();
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';

    let targetKey = cat;
    if (mathDatabase[cat]) {
        targetKey = cat;
    } else if (cat === 'calculo' || cat === 'calculus' || cat === 'cálculo') {
        targetKey = 'calculus';
    } else if (cat === 'algebra' || cat === 'álgebra' || cat === 'basico') {
        targetKey = 'algebra';
    } else if (cat === 'cuantica' || cat === 'cuántica' || cat === 'fisica') {
        targetKey = 'cuantica';
    } else if (cat === 'matrices' || cat === 'matriz') {
        targetKey = 'matrices';
    } else if (cat === 'griegas' || cat === 'simbolos') {
        targetKey = 'griegas';
    }

    let sections = [];
    if (q) {
        const visited = new Set();
        Object.keys(mathDatabase).forEach(c => {
            const arr = mathDatabase[c];
            if (Array.isArray(arr) && !visited.has(arr)) {
                visited.add(arr);
                sections = sections.concat(arr);
            }
        });
    } else {
        sections = mathDatabase[targetKey] || mathDatabase[cat] || [];
    }

    const esc = typeof escapeHtml === 'function' ? escapeHtml : (s) => s;

    sections.forEach(sec => {
        const filteredItems = sec.items.filter(item => {
            if (!q) return true;
            const lEs = (item.label || '').toLowerCase();
            const lEn = (item.labelEn || '').toLowerCase();
            const code = (item.code || '').toLowerCase();
            const disp = (item.display || '').toLowerCase();
            return lEs.includes(q) || lEn.includes(q) || code.includes(q) || disp.includes(q);
        });

        if (filteredItems.length > 0) {
            const secDiv = document.createElement('div');
            secDiv.className = 'math-section';
            const title = (isEn && sec.titleEn) ? sec.titleEn : sec.title;
            secDiv.innerHTML = `<div class="math-section-title">${esc(title)}</div>`;

            const grid = document.createElement('div');
            grid.className = 'math-grid';

            filteredItems.forEach(item => {
                const itemLabel = (isEn && item.labelEn) ? item.labelEn : item.label;
                const btn = document.createElement('button');
                btn.className = 'math-btn';
                btn.type = 'button';
                btn.title = item.code + ' (' + itemLabel + ')';
                btn.innerHTML = `
                    <span>${esc(item.display)}</span>
                    <span class="math-btn-label">${esc(itemLabel)}</span>
                `;

                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    insertIntoFormula(item.code, item.cursorOffset);
                };

                grid.appendChild(btn);
            });

            secDiv.appendChild(grid);
            bodyContainer.appendChild(secDiv);
        }
    });

    if (bodyContainer.children.length === 0) {
        const noResultsMsg = isEn 
            ? 'No symbols or equations found matching your search.' 
            : 'No se encontraron símbolos para esa búsqueda.';
        bodyContainer.innerHTML = `<p class="text-muted" style="text-align:center; padding:24px; font-size:13px;">${noResultsMsg}</p>`;
    }
}

/**
 * Renderiza los símbolos del Quick Ribbon mediante KaTeX
 */
function renderQuickRibbonKaTeX() {
    const quickRibbon = document.getElementById('mathQuickRibbon');
    if (!quickRibbon || !window.katex) return;
    const quickKaTeX = {
        "\\frac{a}{b}": "\\frac{a}{b}",
        "\\sqrt{x}": "\\sqrt{x}",
        "\\sqrt[n]{x}": "\\sqrt[n]{x}",
        "x^{n}": "x^n",
        "x_{i}": "x_i",
        "\\int_{a}^{b} f(x) \\, dx": "\\int_a^b",
        "\\frac{\\partial f}{\\partial x}": "\\frac{\\partial}{\\partial x}",
        "\\sum_{i=1}^{n}": "\\sum",
        "\\lim_{x \\to a}": "\\lim",
        "\\left( x \\right)": "( \\cdot )",
        "\\left[ x \\right]": "[ \\cdot ]",
        "\\left\\{ x \\right\\}": "\\{ \\cdot \\}",
        "\\left| x \\right|": "| x |",
        "|\\psi\\rangle": "|\\psi\\rangle",
        "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}": "\\begin{pmatrix} \\cdot & \\cdot \\\\ \\cdot & \\cdot \\end{pmatrix}",
        "\\pm": "\\pm",
        "\\alpha": "\\alpha",
        "\\pi": "\\pi",
        "\\infty": "\\infty"
    };

    quickRibbon.querySelectorAll('.math-quick-btn').forEach(btn => {
        const code = btn.getAttribute('data-code');
        if (code && quickKaTeX[code]) {
            try {
                btn.innerHTML = window.katex.renderToString(quickKaTeX[code], { displayMode: false, throwOnError: false });
            } catch (e) {}
        }
    });
}

/**
 * Abre el modal del Teclado Matemático y actualiza vistas previas
 */
function openMathModal() {
    const modal = document.getElementById('modalMathKeyboard');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderQuickRibbonKaTeX();
    renderMathCategoryTabs();
    renderCategory(mathCurrentCategory);
    renderMathFormulaLive();

    const input = document.getElementById('mathFormulaInput');
    if (input) input.focus();
}

/**
 * Inicializa todos los controles, eventos y atajos del Teclado Matemático
 */
function initMathKeyboard() {
    const modal = document.getElementById('modalMathKeyboard');
    const btnClose = document.getElementById('btnCloseMath');
    const btnCloseSecondary = document.getElementById('btnCloseMathSecondary');
    const searchInput = document.getElementById('mathSearchInput');
    const formulaInput = document.getElementById('mathFormulaInput');
    const btnClear = document.getElementById('btnMathClear');
    const btnUndo = document.getElementById('btnMathUndo');
    const btnRedo = document.getElementById('btnMathRedo');
    const modeSwitch = document.getElementById('mathModeSwitch');
    const btnCopy = document.getElementById('btnCopyMathCode');
    const btnInsert = document.getElementById('btnInsertMathCode');
    const quickRibbon = document.getElementById('mathQuickRibbon');
    const btnMath = document.getElementById('btnMathKeyboard');

    // Botón en la barra de herramientas principal
    if (btnMath) {
        btnMath.onclick = (e) => {
            e.preventDefault();
            openMathModal();
        };
    }

    // Inicializar pestañas dinámicas con todas las 10 categorías
    renderMathCategoryTabs();

    // Quick Ribbon inicial
    if (quickRibbon) {
        renderQuickRibbonKaTeX();
        quickRibbon.querySelectorAll('.math-quick-btn').forEach(btn => {
            const code = btn.getAttribute('data-code');
            btn.onclick = (e) => {
                e.preventDefault();
                if (code) insertIntoFormula(code);
            };
        });
    }

    // Búsqueda en tiempo real
    if (searchInput) {
        searchInput.oninput = (e) => {
            renderCategory(mathCurrentCategory, e.target.value);
        };
    }

    // Eventos del textarea de fórmula
    if (formulaInput) {
        formulaInput.oninput = () => {
            renderMathFormulaLive();
        };

        formulaInput.onkeydown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (btnInsert) btnInsert.click();
            } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                if (btnUndo) btnUndo.click();
            } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                if (btnRedo) btnRedo.click();
            }
        };
    }

    // Botón Limpiar
    if (btnClear) {
        btnClear.onclick = () => {
            if (!formulaInput || !formulaInput.value) return;
            recordMathHistory();
            formulaInput.value = '';
            renderMathFormulaLive();
            formulaInput.focus();
        };
    }

    // Deshacer / Rehacer
    if (btnUndo) {
        btnUndo.onclick = () => {
            if (!formulaInput) return;
            if (mathHistoryIndex > 0) {
                mathHistoryIndex--;
                formulaInput.value = mathHistoryStack[mathHistoryIndex];
                renderMathFormulaLive();
            }
        };
    }

    if (btnRedo) {
        btnRedo.onclick = () => {
            if (!formulaInput) return;
            if (mathHistoryIndex < mathHistoryStack.length - 1) {
                mathHistoryIndex++;
                formulaInput.value = mathHistoryStack[mathHistoryIndex];
                renderMathFormulaLive();
            }
        };
    }

    // Selector de modo de formato (Inline $...$, Display \[...\], Equation)
    if (modeSwitch) {
        modeSwitch.querySelectorAll('.math-mode-btn').forEach(btn => {
            btn.onclick = () => {
                modeSwitch.querySelectorAll('.math-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                mathCurrentMode = btn.getAttribute('data-mode') || 'inline';
                renderMathFormulaLive();
            };
        });
    }

    // Cierre del modal
    if (btnClose && modal) btnClose.onclick = () => modal.classList.add('hidden');
    if (btnCloseSecondary && modal) btnCloseSecondary.onclick = () => modal.classList.add('hidden');

    // Botón Copiar al portapapeles
    if (btnCopy) {
        btnCopy.onclick = async () => {
            if (!formulaInput) return;
            const code = formulaInput.value.trim();
            if (!code) return;
            let formatted = code;
            if (mathCurrentMode === 'inline') {
                formatted = `$${code}$`;
            } else if (mathCurrentMode === 'display') {
                formatted = `\\[\n  ${code}\n\\]`;
            } else if (mathCurrentMode === 'equation') {
                formatted = `\\begin{equation}\n  ${code}\n\\end{equation}`;
            }

            if (typeof fallbackCopyText === 'function') {
                await fallbackCopyText(formatted);
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(formatted);
            }

            const orig = btnCopy.innerHTML;
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            btnCopy.innerHTML = isEn ? '✓ Copied!' : '✓ ¡Copiado!';
            btnCopy.style.color = '#10B981';
            setTimeout(() => { 
                btnCopy.innerHTML = orig; 
                btnCopy.style.color = '';
            }, 1500);
        };
    }

    // Botón Insertar en el Documento Principal
    if (btnInsert) {
        btnInsert.onclick = () => {
            if (!formulaInput) return;
            const code = formulaInput.value.trim();
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            if (!code) {
                if (typeof showToast === 'function') {
                    showToast(isEn ? 'Write or select a formula first.' : 'Escribe o selecciona alguna fórmula primero.', 'info');
                }
                return;
            }
            let formatted = code;
            if (mathCurrentMode === 'inline') {
                formatted = `$${code}$`;
            } else if (mathCurrentMode === 'display') {
                formatted = `\n\\[\n    ${code}\n\\]\n`;
            } else if (mathCurrentMode === 'equation') {
                formatted = `\n\\begin{equation}\n    ${code}\n\\end{equation}\n`;
            }

            if (typeof insertAtCursor === 'function') {
                insertAtCursor(formatted, formatted.length);
            }
            
            if (modal) modal.classList.add('hidden');

            const dict = (typeof i18n !== 'undefined' && i18n[currentLanguage]) ? i18n[currentLanguage] : (typeof i18n !== 'undefined' ? i18n.es : {});
            const statusEl = document.getElementById('editorStatus');
            if (statusEl) {
                statusEl.innerText = dict.status_math_inserted || (isEn ? '✓ Equation inserted' : '✓ Ecuación insertada');
                statusEl.style.color = '#10B981';
                setTimeout(() => {
                    statusEl.innerText = dict.status_auto_saved || (isEn ? 'Auto saved ✓' : 'Guardado automático ✓');
                    statusEl.style.color = '';
                }, 2500);
            }
        };
    }

    // Atajo Alt + M y Escape
    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'm' || e.key === 'M')) {
            e.preventDefault();
            if (!modal) return;
            modal.classList.toggle('hidden');
            if (!modal.classList.contains('hidden')) {
                renderQuickRibbonKaTeX();
                renderMathCategoryTabs();
                renderCategory(mathCurrentCategory);
                renderMathFormulaLive();
                if (formulaInput) formulaInput.focus();
            }
        } else if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    });

    // Gancho para actualizar etiquetas de pestañas cuando cambia el idioma
    if (typeof window.applyLanguage === 'function' && !window._mathEditorLangHooked) {
        window._mathEditorLangHooked = true;
        const origApplyLanguage = window.applyLanguage;
        window.applyLanguage = function(lang) {
            origApplyLanguage(lang);
            renderMathCategoryTabs();
            renderCategory(mathCurrentCategory);
            renderMathFormulaLive();
        };
    }

    // Renderizar categoría inicial y estado predeterminado
    renderCategory('algebra');
    if (formulaInput && !formulaInput.value) {
        formulaInput.value = '\\int_{a}^{b} f(x) \\, dx';
        recordMathHistory();
    }
    renderMathFormulaLive();
}

// Exportaciones globales para interoperabilidad
window.renderMathFormulaLive = renderMathFormulaLive;
window.renderMathCategoryTabs = renderMathCategoryTabs;
window.renderCategory = renderCategory;
window.openMathModal = openMathModal;
window.initMathKeyboard = initMathKeyboard;
window.insertIntoFormula = insertIntoFormula;
