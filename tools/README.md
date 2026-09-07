# Outil de dérushage podcast

`podcast_punchlines.py` repère les moments forts d'un rush et sort les timecodes
prêts à poser sur la timeline. Il accompagne la stratégie de montage décrite dans
`seb-rech-podcast-montage.html` (section 05).

## Installation

```bash
# ffmpeg doit être dans le PATH
pip install faster-whisper
pip install numpy          # optionnel, accélère l'analyse d'énergie
```

## Utilisation

```bash
python3 tools/podcast_punchlines.py --input SEB-RECH-PODCAST-1.mp4 --fps 25
```

La transcription est l'étape longue (compter le tiers de la durée du rush sur GPU,
plusieurs fois la durée sur CPU). Elle est mise en cache : les relances suivantes
sont immédiates, ce qui permet de régler les poids et de relancer sans retranscrire.

Options utiles :

| Option | Effet |
|---|---|
| `--fps 25` | cadence de la timeline, pour le calcul des timecodes |
| `--tc-start 00:00:00:00` | si ta timeline ne démarre pas à `01:00:00:00` |
| `--top 25` | taille de la shortlist |
| `--per-bucket 2` | nombre max de candidats par tranche de 5 min |
| `--model medium` | modèle plus léger si la machine peine (`large-v3` par défaut) |
| `--device cpu --compute-type int8` | forcer le CPU |
| `--transcript f.json --no-asr` | réutiliser une transcription WhisperX / Whisper CLI / Descript |

## Ce qui est produit

Dans `derushage/` :

- `*.shortlist.md` — le tableau à lire, avec les signaux détectés par candidat
- `*.shortlist.csv` — deux colonnes vides `retenu_intro` / `retenu_short` à cocher
- `*.markers.edl` — marqueurs pour DaVinci Resolve
  (clic droit sur la timeline → *Import* → *Timeline Markers from EDL*)
  rouge = rangs 1-6, jaune = 7-14, bleu = réserve
- `*.punchlines.srt` — à déposer comme piste de sous-titres dans n'importe quel
  logiciel pour voir les candidats en place sur la timeline

## Réglage

Les lexiques et les poids sont en tête du fichier, dans le dictionnaire `W` et les
listes `MOTS_*`. C'est la partie à ajuster par client : après un épisode, on regarde
les faux positifs et on corrige. Un poids négatif écarte, un poids positif remonte.

## Limites

Le script note le **texte**, pas l'**image** : il ne sait pas si l'invité boit une
gorgée d'eau au milieu de sa meilleure phrase. Le test du visage reste manuel, et
c'est lui qui élimine le plus de candidats. Le script ne fait pas non plus de
diarisation : il pénalise les questions pour écarter les relances de l'animateur,
mais sur un échange serré il peut remonter une phrase de l'animateur.
