"""Style et palette des figures du bilan Vilber.

Palette categorielle validee (ordre fixe, jamais cycle) :
  1 bleu #2a78d6 · 2 orange #eb6834 · 3 aqua #1baf7a · 4 jaune #eda100

Controles passes sur ces 4 slots (surface claire #fcfcfb, paires adjacentes) :
  bande de clarte OK · plancher de chroma OK
  separation daltonisme  pire paire 9,1 (seuil 8)
  vision normale         pire paire 22,9 (plancher 15)
  contraste vs surface   aqua et jaune sous 3:1 -> on affiche systematiquement
                         les valeurs en clair sur les marques (regle de relief).

Regles appliquees dans tout le notebook :
  - une seule echelle par graphique (jamais deux axes Y) ;
  - la couleur suit l'entite, pas son rang ;
  - >= 2 series -> legende presente, et valeurs etiquetees quand elles sont peu
    nombreuses ;
  - grille et axes en retrait, marques fines.
"""

from __future__ import annotations

import matplotlib as mpl
import matplotlib.pyplot as plt

SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK_SECONDARY = "#52514e"
INK_MUTED = "#8a8880"
GRID = "#e6e5e1"

SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100",
          "#e87ba4", "#008300", "#4a3aa7", "#e34948"]

# Une entite = une couleur, fixee une fois pour tout le rapport.
COLOR_BY_ENTITY = {
    "T0": SERIES[0], "T1": SERIES[1], "T2": SERIES[2], "GLOBAL": SERIES[3],
    "branded": SERIES[1], "non_branded": SERIES[0],
    "Western Blot": SERIES[0], "UV Instruments": SERIES[1],
    "In Vivo": SERIES[2], "Gel Doc": SERIES[3], "Autre": INK_MUTED,
    "clics": SERIES[0], "impressions": SERIES[1], "position": SERIES[2],
}

# Rampe sequentielle (une seule teinte, clair -> fonce) pour les heatmaps.
SEQUENTIAL_BLUE = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5",
                   "#256abf", "#184f95", "#0d366b"]

# Paire divergente (bleu <-> rouge, gris neutre au centre) pour les deltas.
DIVERGING = {"neg": "#e34948", "mid": "#f0efec", "pos": "#2a78d6"}


def apply_style() -> None:
    mpl.rcParams.update({
        "figure.facecolor": SURFACE,
        "axes.facecolor": SURFACE,
        "savefig.facecolor": SURFACE,
        "savefig.dpi": 200,
        "savefig.bbox": "tight",
        "font.size": 10,
        "text.color": INK,
        "axes.labelcolor": INK_SECONDARY,
        "axes.edgecolor": GRID,
        "axes.titlesize": 12,
        "axes.titleweight": "semibold",
        "axes.titlelocation": "left",
        "axes.titlepad": 12,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.grid": True,
        "axes.axisbelow": True,
        "grid.color": GRID,
        "grid.linewidth": 0.8,
        "xtick.color": INK_SECONDARY,
        "ytick.color": INK_SECONDARY,
        "xtick.direction": "out",
        "ytick.direction": "out",
        "legend.frameon": False,
        "legend.fontsize": 9,
        "lines.linewidth": 2,
        "lines.markersize": 6,
    })


def color_for(entity: str, fallback_index: int = 0) -> str:
    return COLOR_BY_ENTITY.get(entity, SERIES[fallback_index % len(SERIES)])


def label_bars(ax, bars, fmt: str = "{:,.0f}", padding: float = 3) -> None:
    """Regle de relief : les valeurs sont toujours lisibles, meme si la marque
    n'atteint pas 3:1 de contraste avec la surface."""
    ax.bar_label(bars, fmt=fmt, padding=padding, color=INK_SECONDARY, fontsize=9)


def sequential_cmap():
    from matplotlib.colors import LinearSegmentedColormap

    return LinearSegmentedColormap.from_list("vilber_blue", SEQUENTIAL_BLUE)


def diverging_cmap():
    from matplotlib.colors import LinearSegmentedColormap

    return LinearSegmentedColormap.from_list(
        "vilber_div", [DIVERGING["neg"], DIVERGING["mid"], DIVERGING["pos"]])


def save(fig, name: str):
    from config import FIGURES_DIR

    path = FIGURES_DIR / f"{name}.png"
    fig.savefig(path)
    print(f"figure ecrite : {path.relative_to(path.parents[2])}")
    return path
