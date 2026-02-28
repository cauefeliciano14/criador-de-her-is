#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

DATASET = Path("src/data/spells.generated.json")
KNOWN_SCHOOLS = {
    "Abjuração",
    "Adivinhação",
    "Encantamento",
    "Evocação",
    "Ilusão",
    "Invocação",
    "Necromancia",
    "Transmutação",
    "Conjuração",  # compatibilidade com nomenclatura legada
}
KNOWN_CLASSES = {"Bardo", "Bruxo", "Clérigo", "Druida", "Feiticeiro", "Guardião", "Mago", "Paladino"}


def validate(spells: list[dict]) -> list[str]:
    errors: list[str] = []
    id_counts = Counter(s.get("id") for s in spells)

    for idx, s in enumerate(spells, 1):
        sid = s.get("id", "<sem-id>")
        p = f"#{idx} [{sid}]"

        if id_counts[s.get("id")] > 1:
            errors.append(f"{p}: id duplicado")

        if not s.get("name"):
            errors.append(f"{p}: name vazio")
        if not s.get("description"):
            errors.append(f"{p}: description vazia")

        if s.get("level") not in (0, 1, 2):
            errors.append(f"{p}: level inválido ({s.get('level')})")

        if s.get("school") not in KNOWN_SCHOOLS:
            errors.append(f"{p}: school inválida ({s.get('school')})")

        for fld in ("castingTime", "range", "components", "duration"):
            if not str(s.get(fld, "")).strip():
                errors.append(f"{p}: {fld} vazio")

        ritual_expected = "Ritual" in str(s.get("castingTime", ""))
        if bool(s.get("ritual")) != ritual_expected:
            errors.append(f"{p}: ritual inconsistente com castingTime")

        concentration_expected = "Concentração" in str(s.get("duration", ""))
        if bool(s.get("concentration")) != concentration_expected:
            errors.append(f"{p}: concentration inconsistente com duration")

        classes = s.get("classes")
        if not isinstance(classes, list) or not classes:
            errors.append(f"{p}: classes vazio/invalid")
        else:
            bad_classes = [c for c in classes if c not in KNOWN_CLASSES]
            if bad_classes:
                errors.append(f"{p}: classes inválidas ({', '.join(bad_classes)})")

    ordered = sorted(spells, key=lambda x: str(x.get("name", "")).casefold())
    if [s.get("id") for s in ordered] != [s.get("id") for s in spells]:
        errors.append("Dataset não está ordenado por name (pt-BR)")

    return errors


def main() -> int:
    if not DATASET.exists():
        print(f"❌ Dataset não encontrado: {DATASET}")
        return 1

    spells = json.loads(DATASET.read_text(encoding="utf-8"))
    errors = validate(spells)
    counts = Counter(s.get("level") for s in spells)

    print(f"Contagem por nível: 0={counts.get(0,0)} 1={counts.get(1,0)} 2={counts.get(2,0)}")

    if errors:
        print("\n❌ Erros de validação:")
        for err in errors:
            print(f"- {err}")
        return 1

    print(f"\n✅ validate:spells OK ({len(spells)} magias)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
