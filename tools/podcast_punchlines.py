#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
podcast_punchlines.py — reperage automatique des moments forts d'un podcast.

Uplye Studio · pipeline de derushage pour l'intro « DANS CET EPISODE ».

Ce que fait le script
---------------------
1. extrait l'audio du rush avec ffmpeg (wav 16 kHz mono)
2. le transcrit avec faster-whisper, horodatage au mot
3. recoupe la transcription en phrases exploitables
4. note chaque phrase sur des criteres de « punchline » (chiffres, tension,
   aveu, contre-intuition, adresse directe, energie vocale, isolabilite)
5. selectionne une shortlist repartie sur toute la duree de l'episode
6. exporte : shortlist lisible (.md), marqueurs Resolve (.edl),
   tableur (.csv), sous-titres reperes (.srt)

Le script ne monte pas a ta place. Il transforme 90 minutes d'ecoute
en 15 minutes de verification. Le choix final reste editorial.

Usage
-----
    python3 podcast_punchlines.py --input SEB-RECH-PODCAST-1.mp4

    # reutiliser une transcription deja faite (WhisperX, Whisper CLI, Descript export JSON)
    python3 podcast_punchlines.py --input rush.mp4 --transcript rush.json --no-asr

    # timeline demarrant a 00:00:00:00 au lieu de 01:00:00:00, en 25 fps
    python3 podcast_punchlines.py --input rush.mp4 --fps 25 --tc-start 00:00:00:00

Dependances
-----------
    ffmpeg (dans le PATH)
    pip install faster-whisper        # transcription
    pip install numpy                 # optionnel, accelere l'analyse d'energie
"""

import argparse
import csv
import json
import math
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import wave

# --------------------------------------------------------------------------
# 1. LEXIQUES DE SCORING (francais)
# --------------------------------------------------------------------------
# Chaque famille porte un poids. Les poids sont volontairement lisibles et
# modifiables : c'est la partie du script qu'on regle par client.

W = {
    "chiffre": 2.6,       # un montant, un pourcentage, une duree concrete
    "absolu": 2.0,        # jamais / toujours / personne / le seul
    "aveu": 3.0,          # echec, perte, peur, faillite — le carburant emotionnel
    "contre_intuitif": 2.4,  # « en fait », « tout le monde croit que »
    "adresse": 1.4,       # parle au spectateur, pas a l'invite
    "conseil": 1.2,       # formulation prescriptive
    "longueur": 1.8,      # duree et nombre de mots dans la fenetre utile
    "energie": 1.6,       # volume vocal au-dessus de la mediane
    "isolable": 2.2,      # silence avant ET apres : coupe propre garantie
    "penalite_connecteur": -3.4,  # commence par « donc », « du coup »...
    "penalite_anaphore": -2.6,    # commence par un pronom sans antecedent
    "penalite_hesitation": -1.8,  # euh, hum, bafouillage
    "penalite_question": -2.2,    # c'est une relance de l'animateur
    "penalite_meta": -3.0,        # « bienvenue », « merci d'etre la », logistique
}

RE_CHIFFRE = re.compile(
    r"(\d[\d\s.,]*\s*(?:%|euros?|€|k€|balles|millions?|milliards?|mille|ans?|mois|jours?|heures?|fois|clients?|salaries?|abonnes?))"
    r"|(\d[\d\s.,]{2,})",
    re.I,
)

MOTS_ABSOLUS = [
    "jamais", "toujours", "personne", "aucun", "aucune", "tout le monde",
    "le seul", "la seule", "le pire", "la pire", "le meilleur", "la meilleure",
    "zero", "100 %", "100%", "rien du tout", "systematiquement", "n'importe qui",
]

MOTS_AVEU = [
    "j'ai perdu", "j'ai rate", "je me suis plante", "j'ai failli", "erreur",
    "echec", "echoue", "faillite", "depose le bilan", "licencie", "vire",
    "j'ai eu peur", "peur", "honte", "j'ai pleure", "burn out", "burnout",
    "depression", "j'ai arrete", "j'ai tout perdu", "on m'a dit non", "refuse",
    "je regrette", "regret", "le plus dur", "j'ai galere", "dette", "endette",
    "j'ai menti", "je ne savais pas", "j'etais paume", "au fond du trou",
]

MOTS_CONTRE_INTUITIF = [
    "en fait", "la verite c'est", "la verite", "ce que personne", "personne ne dit",
    "tout le monde croit", "tout le monde pense", "on m'a toujours dit",
    "contrairement a", "a l'inverse", "le truc c'est", "ce qu'on ne dit pas",
    "on croit que", "c'est faux", "c'est un mythe", "l'erreur c'est",
    "ce qui a tout change", "le declic",
]

MOTS_CONSEIL = [
    "il faut", "tu dois", "vous devez", "ne fais pas", "ne faites pas",
    "commence par", "commencez par", "arrete de", "arretez de", "la regle",
    "mon conseil", "si j'avais su", "si je devais recommencer",
]

RE_ADRESSE = re.compile(r"\b(tu|t'|toi|ton|ta|tes|vous|votre|vos)\b", re.I)

CONNECTEURS_TETE = [
    "donc", "du coup", "et donc", "alors", "alors la", "voila", "bah", "ben",
    "ouais", "enfin", "bref", "apres", "et puis", "puis", "mais bon", "par contre",
    "c'est-a-dire", "en gros", "et la", "et ca", "et voila", "du moins", "ensuite",
]

ANAPHORES_TETE = [
    "il", "elle", "ils", "elles", "ca", "cela", "ce truc", "ce mec", "cette chose",
    "lui", "eux", "celui-la", "ce gars", "la-dedans", "dedans", "y",
]

HESITATIONS = ["euh", "heu", "hum", "hein", "mmh", "bah bah", "je veux dire je veux dire"]

MOTS_META = [
    "bienvenue", "merci d'etre la", "merci d'etre venu", "bonjour a tous",
    "salut a tous", "abonne-toi", "abonnez-vous", "like", "on va commencer",
    "avant de commencer", "premiere question", "on se retrouve", "a bientot",
    "c'etait", "merci beaucoup", "on fait un test", "ca tourne", "je me presente",
    "sponsor", "partenaire de l'episode",
]


# --------------------------------------------------------------------------
# 2. UTILITAIRES
# --------------------------------------------------------------------------

def deaccent(s):
    """Compare sans accents : les lexiques sont ecrits sans accent."""
    return "".join(
        c for c in unicodedata.normalize("NFD", s.lower())
        if unicodedata.category(c) != "Mn"
    )


def tc_from_seconds(seconds, fps, offset_frames=0):
    """Secondes -> timecode HH:MM:SS:FF (non-drop)."""
    total = int(round(seconds * fps)) + offset_frames
    if total < 0:
        total = 0
    f = total % int(fps)
    total //= int(fps)
    s = total % 60
    total //= 60
    m = total % 60
    h = (total // 60) % 24
    return "%02d:%02d:%02d:%02d" % (h, m, s, f)


def tc_to_frames(tc, fps):
    h, m, s, f = (int(x) for x in tc.split(":"))
    return ((h * 60 + m) * 60 + s) * int(fps) + f


def hms(seconds):
    """Secondes -> 00:00:00 lisible (pour la shortlist et YouTube)."""
    seconds = int(round(seconds))
    return "%02d:%02d:%02d" % (seconds // 3600, (seconds % 3600) // 60, seconds % 60)


def srt_time(seconds):
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return "%02d:%02d:%02d,%03d" % (h, m, s, ms)


# --------------------------------------------------------------------------
# 3. AUDIO
# --------------------------------------------------------------------------

def extract_audio(video_path, wav_path):
    if shutil.which("ffmpeg") is None:
        sys.exit("ffmpeg introuvable dans le PATH. Installe-le avant de relancer.")
    print("[1/6] Extraction audio -> %s" % wav_path)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", video_path,
         "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav_path],
        check=True,
    )
    return wav_path


def rms_envelope(wav_path, hop=0.10):
    """Enveloppe d'energie, une valeur tous les `hop` secondes.

    Sert a reperer les phrases dites avec de l'appui : une punchline murmuree
    passe rarement en intro.
    """
    print("[3/6] Analyse de l'energie vocale...")
    try:
        import numpy as np
        have_np = True
    except ImportError:
        have_np = False

    with wave.open(wav_path, "rb") as w:
        sr = w.getframerate()
        chunk = max(1, int(sr * hop))
        env = []
        while True:
            raw = w.readframes(chunk)
            if not raw:
                break
            if have_np:
                a = np.frombuffer(raw, dtype="<i2").astype("float64")
                env.append(float(math.sqrt((a * a).mean())) if a.size else 0.0)
            else:
                import array
                a = array.array("h")
                a.frombytes(raw[: len(raw) - (len(raw) % 2)])
                env.append(math.sqrt(sum(v * v for v in a) / len(a)) if len(a) else 0.0)
    return env, hop


def energy_of(env, hop, start, end):
    i0 = int(start / hop)
    i1 = max(i0 + 1, int(end / hop))
    window = env[i0:i1]
    return sum(window) / len(window) if window else 0.0


# --------------------------------------------------------------------------
# 4. TRANSCRIPTION
# --------------------------------------------------------------------------

def transcribe(wav_path, model_size, language, device, compute_type):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit(
            "faster-whisper n'est pas installe.\n"
            "  pip install faster-whisper\n"
            "Ou passe une transcription deja faite : --transcript fichier.json --no-asr"
        )
    print("[2/6] Transcription (%s, %s)... c'est l'etape longue." % (model_size, device))
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    segments, _info = model.transcribe(
        wav_path, language=language, word_timestamps=True,
        vad_filter=True, vad_parameters={"min_silence_duration_ms": 400},
    )
    out = []
    for seg in segments:
        words = [
            {"word": w.word, "start": w.start, "end": w.end}
            for w in (seg.words or []) if w.start is not None
        ]
        out.append({"start": seg.start, "end": seg.end, "text": seg.text, "words": words})
        print("    %s  %s" % (hms(seg.start), seg.text.strip()[:88]))
    return out


def load_transcript(path):
    """Accepte les JSON de faster-whisper, WhisperX et Whisper CLI."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    segs = data.get("segments", data if isinstance(data, list) else [])
    out = []
    for s in segs:
        words = []
        for w in s.get("words", []) or []:
            token = w.get("word", w.get("text", ""))
            if w.get("start") is None:
                continue
            words.append({"word": token, "start": float(w["start"]), "end": float(w.get("end", w["start"]))})
        out.append({
            "start": float(s.get("start", words[0]["start"] if words else 0.0)),
            "end": float(s.get("end", words[-1]["end"] if words else 0.0)),
            "text": s.get("text", " ".join(x["word"] for x in words)),
            "words": words,
        })
    return out


# --------------------------------------------------------------------------
# 5. DECOUPAGE EN PHRASES
# --------------------------------------------------------------------------

def build_sentences(segments, max_gap=0.55, max_dur=14.0):
    """Recoupe le flux de mots en phrases.

    On coupe sur la ponctuation forte OU sur un silence > max_gap : a l'oral,
    le silence est une ponctuation plus fiable que celle de la machine.
    """
    words = []
    for seg in segments:
        if seg["words"]:
            words.extend(seg["words"])
        else:  # segment sans horodatage au mot : on garde le segment tel quel
            words.append({"word": seg["text"], "start": seg["start"], "end": seg["end"]})

    sentences, cur = [], []

    def flush():
        if not cur:
            return
        text = "".join(w["word"] for w in cur).strip()
        text = re.sub(r"\s+", " ", text)
        if len(text) < 12:
            return
        sentences.append({
            "text": text,
            "start": cur[0]["start"],
            "end": cur[-1]["end"],
            "n_words": len(cur),
        })

    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else 99.0
        hard = w["word"].strip().endswith((".", "!", "?", "…"))
        too_long = (w["end"] - cur[0]["start"]) >= max_dur
        if hard or gap >= max_gap or too_long or nxt is None:
            flush()
            cur = []

    # silences avant / apres : condition d'une coupe propre
    for i, s in enumerate(sentences):
        s["gap_before"] = s["start"] - sentences[i - 1]["end"] if i else 3.0
        s["gap_after"] = sentences[i + 1]["start"] - s["end"] if i + 1 < len(sentences) else 3.0
        s["dur"] = s["end"] - s["start"]
    return sentences


# --------------------------------------------------------------------------
# 6. SCORING
# --------------------------------------------------------------------------

def count_hits(flat, lexicon):
    return sum(1 for term in lexicon if term in flat)


def bell(x, lo, hi):
    """1.0 au centre de [lo, hi], 0 en dehors. Sert aux fenetres de duree."""
    if x <= lo or x >= hi:
        return 0.0
    mid = (lo + hi) / 2.0
    return 1.0 - abs(x - mid) / ((hi - lo) / 2.0)


def score_sentence(s, env_median, energy):
    flat = deaccent(s["text"])
    first = flat.lstrip("«\"' ").split()
    first1 = first[0] if first else ""
    first2 = " ".join(first[:2]) if len(first) > 1 else first1

    reasons, score = [], 0.0

    def add(key, n, label):
        nonlocal score
        if n:
            gain = W[key] * min(n, 2)
            score += gain
            reasons.append(label)

    add("chiffre", len(RE_CHIFFRE.findall(flat)), "chiffre")
    add("absolu", count_hits(flat, MOTS_ABSOLUS), "absolu")
    add("aveu", count_hits(flat, MOTS_AVEU), "aveu/tension")
    add("contre_intuitif", count_hits(flat, MOTS_CONTRE_INTUITIF), "contre-intuitif")
    add("conseil", count_hits(flat, MOTS_CONSEIL), "conseil")
    if RE_ADRESSE.search(flat):
        score += W["adresse"]
        reasons.append("adresse directe")

    # fenetre utile : 3-9 s et 8-32 mots. Hors de la, ca ne tient pas en intro.
    fit = 0.5 * bell(s["dur"], 2.0, 11.0) + 0.5 * bell(s["n_words"], 6, 34)
    score += W["longueur"] * fit

    if env_median > 0:
        score += W["energie"] * max(-1.0, min(1.5, (energy / env_median) - 1.0))

    if s["gap_before"] >= 0.35 and s["gap_after"] >= 0.35:
        score += W["isolable"]
        reasons.append("coupe propre")

    if first1 in CONNECTEURS_TETE or first2 in CONNECTEURS_TETE:
        score += W["penalite_connecteur"]
        reasons.append("!demarre sur un connecteur")
    if first1 in ANAPHORES_TETE:
        score += W["penalite_anaphore"]
        reasons.append("!pronom sans antecedent")
    if count_hits(flat, HESITATIONS):
        score += W["penalite_hesitation"]
        reasons.append("!hesitation")
    if s["text"].rstrip().endswith("?"):
        score += W["penalite_question"]
        reasons.append("!question (relance animateur)")
    if count_hits(flat, MOTS_META):
        score += W["penalite_meta"]
        reasons.append("!plateau/logistique")

    s["score"] = round(score, 2)
    s["reasons"] = reasons
    return s


# --------------------------------------------------------------------------
# 7. SELECTION REPARTIE
# --------------------------------------------------------------------------

def select(sentences, top, bucket_minutes=5, per_bucket=2):
    """Prend les meilleurs, mais jamais plus de `per_bucket` par tranche.

    Sans ca, la shortlist se concentre sur le passage le plus dense de
    l'episode et l'intro raconte un seul sujet au lieu d'en ouvrir cinq.
    """
    ranked = sorted(sentences, key=lambda x: -x["score"])
    used, out = {}, []
    for s in ranked:
        b = int(s["start"] // (bucket_minutes * 60))
        if used.get(b, 0) >= per_bucket:
            continue
        used[b] = used.get(b, 0) + 1
        out.append(s)
        if len(out) >= top:
            break
    # rattrapage : sur un episode court, les tranches saturent avant d'avoir
    # atteint `top`. On complete alors au score pur, sans contrainte de tranche.
    if len(out) < top:
        chosen = {id(s) for s in out}
        for s in ranked:
            if id(s) in chosen:
                continue
            out.append(s)
            if len(out) >= top:
                break
    return sorted(out, key=lambda x: x["start"])


# --------------------------------------------------------------------------
# 8. EXPORTS
# --------------------------------------------------------------------------

def write_markdown(path, picks, meta):
    lines = [
        "# Shortlist punchlines — %s" % meta["name"],
        "",
        "%d candidats · source `%s` · %s fps · TC timeline depart `%s`"
        % (len(picks), meta["name"], meta["fps"], meta["tc_start"]),
        "",
        "> Verification manuelle obligatoire : le script note le **texte**, pas l'**image**.",
        "> Ecoute chaque candidat avant de le retenir, et coche le test du visage.",
        "",
        "| Rang | TC timeline | Reperage | Duree | Score | Extrait | Signaux |",
        "|---|---|---|---|---|---|---|",
    ]
    for i, s in enumerate(picks, 1):
        txt = s["text"].replace("|", "/")
        if len(txt) > 190:
            txt = txt[:187] + "..."
        lines.append("| #%02d | `%s` | %s | %.1fs | %.1f | %s | %s |" % (
            s["rank"], s["tc_in"], hms(s["start"]), s["dur"], s["score"], txt,
            ", ".join(s["reasons"]) or "-",
        ))
    lines += [
        "",
        "## Ordre de montage propose pour « DANS CET EPISODE »",
        "",
        "Ne garde pas l'ordre chronologique ci-dessus. Reclasse par intensite croissante :",
        "",
        "1. **Hameçon** — le candidat le plus brutal, monte nu, sans musique",
        "2. **Rafale** — 3 a 4 candidats de 3-6 s, chacun sur un sujet different",
        "3. **Sommet** — le plus gros chiffre ou l'aveu le plus personnel",
        "4. **Bascule** — carton titre + nom de l'invite, puis entree dans l'episode",
        "",
    ]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def write_csv(path, picks):
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["rang", "tc_in", "tc_out", "start_s", "end_s", "duree_s",
                    "score", "signaux", "texte", "retenu_intro", "retenu_short"])
        for s in picks:
            w.writerow([s["rank"], s["tc_in"], s["tc_out"], round(s["start"], 2), round(s["end"], 2),
                        round(s["dur"], 2), s["score"], " / ".join(s["reasons"]),
                        s["text"], "", ""])


def write_edl(path, picks, title):
    """EDL de marqueurs pour DaVinci Resolve.

    Import : clic droit sur la timeline > Import > Timeline Markers from EDL.
    """
    out = ["TITLE: %s" % title[:60], "FCM: NON-DROP FRAME", ""]
    for i, s in enumerate(picks, 1):
        # rouge = coeur de l'intro, jaune = reserve, bleu = a ecarter a priori
        rank = s["rank"]
        color = ("ResolveColorRed" if rank <= 6
                 else "ResolveColorYellow" if rank <= 14 else "ResolveColorBlue")
        note = re.sub(r"[\r\n|]", " ", s["text"])[:120]
        out.append("%03d  001      V     C        %s %s %s %s"
                   % (i, s["tc_in"], s["tc_out"], s["tc_in"], s["tc_out"]))
        out.append(" |C:%s |M:#%02d [%.1f] %s |D:1" % (color, rank, s["score"], note))
        out.append("")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))


def write_srt(path, picks):
    """Piste de sous-titres a deposer sur la timeline : les candidats
    deviennent visibles au bon endroit dans n'importe quel logiciel."""
    blocks = []
    for i, s in enumerate(picks, 1):
        blocks.append("%d\n%s --> %s\n[#%02d · %.1f] %s\n"
                      % (i, srt_time(s["start"]), srt_time(s["end"]),
                         s["rank"], s["score"], s["text"]))
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))


# --------------------------------------------------------------------------
# 9. CLI
# --------------------------------------------------------------------------

def main():
    p = argparse.ArgumentParser(description="Reperage des moments forts d'un podcast.")
    p.add_argument("--input", required=True, help="fichier video ou audio du rush")
    p.add_argument("--outdir", default="derushage")
    p.add_argument("--transcript", help="JSON de transcription deja produit")
    p.add_argument("--no-asr", action="store_true", help="ne pas transcrire (exige --transcript)")
    p.add_argument("--model", default="large-v3", help="taille de modele faster-whisper")
    p.add_argument("--lang", default="fr")
    p.add_argument("--device", default="auto", help="auto | cpu | cuda")
    p.add_argument("--compute-type", default="default", help="ex: int8, float16")
    p.add_argument("--fps", type=float, default=25.0, help="cadence de la timeline")
    p.add_argument("--tc-start", default="01:00:00:00", help="TC de depart de la timeline")
    p.add_argument("--top", type=int, default=25, help="taille de la shortlist")
    p.add_argument("--per-bucket", type=int, default=2, help="max de candidats par tranche de 5 min")
    args = p.parse_args()

    if not os.path.exists(args.input):
        sys.exit("Fichier introuvable : %s" % args.input)
    os.makedirs(args.outdir, exist_ok=True)
    name = os.path.splitext(os.path.basename(args.input))[0]
    stem = os.path.join(args.outdir, name)
    wav = stem + ".16k.wav"

    if not os.path.exists(wav):
        extract_audio(args.input, wav)
    else:
        print("[1/6] Audio deja extrait, reutilise : %s" % wav)

    tj = args.transcript or (stem + ".transcript.json")
    if args.no_asr or (args.transcript and os.path.exists(tj)):
        if not os.path.exists(tj):
            sys.exit("--no-asr demande mais aucune transcription trouvee (%s)" % tj)
        print("[2/6] Transcription rechargee : %s" % tj)
        segments = load_transcript(tj)
    elif os.path.exists(tj):
        print("[2/6] Transcription deja presente, rechargee : %s" % tj)
        segments = load_transcript(tj)
    else:
        segments = transcribe(wav, args.model, args.lang, args.device, args.compute_type)
        with open(tj, "w", encoding="utf-8") as f:
            json.dump({"segments": segments}, f, ensure_ascii=False, indent=1)

    env, hop = rms_envelope(wav)
    ordered = sorted(env)
    env_median = ordered[len(ordered) // 2] if ordered else 0.0

    print("[4/6] Decoupage en phrases...")
    sentences = build_sentences(segments)
    print("      %d phrases exploitables" % len(sentences))

    print("[5/6] Scoring...")
    for s in sentences:
        score_sentence(s, env_median, energy_of(env, hop, s["start"], s["end"]))

    picks = select(sentences, args.top, per_bucket=args.per_bucket)
    for rank, sel in enumerate(sorted(picks, key=lambda x: -x["score"]), 1):
        sel["rank"] = rank
    off = tc_to_frames(args.tc_start, args.fps)
    for s in picks:
        s["tc_in"] = tc_from_seconds(s["start"], args.fps, off)
        s["tc_out"] = tc_from_seconds(s["end"], args.fps, off)

    print("[6/6] Exports...")
    meta = {"name": name, "fps": args.fps, "tc_start": args.tc_start}
    write_markdown(stem + ".shortlist.md", picks, meta)
    write_csv(stem + ".shortlist.csv", picks)
    write_edl(stem + ".markers.edl", picks, "PUNCHLINES " + name)
    write_srt(stem + ".punchlines.srt", picks)

    print("\n%d candidats retenus. Fichiers ecrits dans %s/ :" % (len(picks), args.outdir))
    for ext in (".shortlist.md", ".shortlist.csv", ".markers.edl", ".punchlines.srt"):
        print("   " + stem + ext)
    print("\nTop 8 :")
    for i, s in enumerate(sorted(picks, key=lambda x: -x["score"])[:8], 1):
        print("  %d. [%5.1f] %s  %s" % (i, s["score"], s["tc_in"], s["text"][:96]))


if __name__ == "__main__":
    main()
