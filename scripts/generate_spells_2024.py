#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import unicodedata
import zipfile
from collections import Counter
from dataclasses import dataclass, asdict
from pathlib import Path
import xml.etree.ElementTree as ET

DOCX_DEFAULT = "/mnt/data/D&D 5.5 - Livro do Jogador (2024) 5.1.docx"
PDF_DEFAULT = "/mnt/data/7-Magias.pdf"
OUTPUT_DEFAULT = "src/data/spells.generated.json"

SCHOOLS = {
    "Abjuração",
    "Adivinhação",
    "Encantamento",
    "Evocação",
    "Ilusão",
    "Invocação",
    "Necromancia",
    "Transmutação",
    "Conjuração",  # fallback de nomenclatura encontrada em bases antigas
}

META_RE = re.compile(
    r"^(?:(Truque) de ([^(]+)|([12])º Círculo, ([^(]+))\s*\(([^)]+)\)\s*$"
)

@dataclass
class Spell:
    id: str
    name: str
    level: int
    school: str
    classes: list[str]
    castingTime: str
    range: str
    components: str
    duration: str
    ritual: bool
    concentration: bool
    description: str
    atHigherLevels: str | None = None
    cantripUpgrade: str | None = None


def slugify(value: str) -> str:
    no_accents = "".join(ch for ch in unicodedata.normalize("NFD", value) if unicodedata.category(ch) != "Mn")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", no_accents.lower()).strip("-")
    return slug


def _extract_docx_lines(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as zf:
        xml_content = zf.read("word/document.xml")

    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    root = ET.fromstring(xml_content)
    lines: list[str] = []
    for paragraph in root.findall(".//w:p", ns):
        chunks = [n.text or "" for n in paragraph.findall(".//w:t", ns)]
        text = "".join(chunks).replace("\xa0", " ").strip()
        if text:
            lines.append(re.sub(r"\s+", " ", text))
    return lines


def _extract_description_blocks(description: str) -> tuple[str, str | None, str | None]:
    higher = None
    cantrip = None
    body = description

    m_higher = re.search(r"(Usando um Espaço de Magia de Círculo Superior\.[\s\S]*)", body)
    if m_higher:
        higher = m_higher.group(1).strip()
        body = body[: m_higher.start()].strip()

    m_cantrip = re.search(r"(Aprimoramento de Truque\.[\s\S]*)", body)
    if m_cantrip:
        cantrip = m_cantrip.group(1).strip()
        body = body[: m_cantrip.start()].strip()

    return body.strip(), higher, cantrip


def parse_docx_spells(docx: Path) -> list[Spell]:
    lines = _extract_docx_lines(docx)

    # recorta a seção de magias
    start_idx = next((i for i, ln in enumerate(lines) if ln.lower().startswith("capítulo 7") and "magias" in ln.lower()), 0)
    lines = lines[start_idx:]

    spells: list[Spell] = []
    seen_ids: Counter[str] = Counter()
    i = 0
    while i < len(lines) - 6:
        name = lines[i]
        meta_match = META_RE.match(lines[i + 1])
        if not meta_match:
            i += 1
            continue

        if not lines[i + 2].startswith("Tempo de Conjuração:"):
            i += 1
            continue

        is_cantrip = bool(meta_match.group(1))
        level = 0 if is_cantrip else int(meta_match.group(3))
        if level not in (0, 1, 2):
            i += 1
            continue

        school = (meta_match.group(2) if is_cantrip else meta_match.group(4) or "").strip()
        classes_raw = meta_match.group(5) or ""
        classes = [c.strip() for c in classes_raw.split(",") if c.strip()]

        casting = lines[i + 2].split(":", 1)[1].strip()
        rng = lines[i + 3].split(":", 1)[1].strip() if lines[i + 3].startswith("Alcance:") else ""
        components = lines[i + 4].split(":", 1)[1].strip() if lines[i + 4].startswith("Componentes:") else ""
        duration = lines[i + 5].split(":", 1)[1].strip() if lines[i + 5].startswith("Duração:") else ""

        j = i + 6
        desc_lines: list[str] = []
        while j < len(lines) - 1 and not META_RE.match(lines[j + 1]):
            desc_lines.append(lines[j])
            j += 1

        description = "\n".join(desc_lines).strip()
        description, higher, cantrip = _extract_description_blocks(description)

        spell_id = slugify(name)
        seen_ids[spell_id] += 1
        if seen_ids[spell_id] > 1:
            spell_id = f"{spell_id}-{seen_ids[spell_id]}"

        spells.append(
            Spell(
                id=spell_id,
                name=name,
                level=level,
                school=school,
                classes=sorted(set(classes), key=lambda n: n.casefold()),
                castingTime=casting,
                range=rng,
                components=components,
                duration=duration,
                ritual="Ritual" in casting,
                concentration="Concentração" in duration,
                description=description,
                atHigherLevels=higher,
                cantripUpgrade=cantrip,
            )
        )
        i = j

    spells.sort(key=lambda s: s.name.casefold())
    return spells


def parse_pdf_spell_names(pdf: Path) -> set[str]:
    try:
        from pypdf import PdfReader  # type: ignore
    except Exception as exc:
        raise RuntimeError("Biblioteca 'pypdf' não encontrada para validação cruzada do PDF") from exc

    names: set[str] = set()
    reader = PdfReader(str(pdf))
    text = "\n".join((p.extract_text() or "") for p in reader.pages)
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if re.match(r"^(Truque de|[12]º Círculo,)", line):
            continue
        if re.match(r"^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ].{2,}$", line) and not ":" in line and len(line) < 80:
            names.add(line)
    return names


def main() -> int:
    parser = argparse.ArgumentParser(description="Gera dataset canônico de magias (níveis 0/1/2) a partir do DOCX 2024.")
    parser.add_argument("--docx", default=DOCX_DEFAULT)
    parser.add_argument("--pdf", default=PDF_DEFAULT)
    parser.add_argument("--output", default=OUTPUT_DEFAULT)
    args = parser.parse_args()

    docx = Path(args.docx)
    pdf = Path(args.pdf)
    output = Path(args.output)

    if not docx.exists():
        raise SystemExit(f"DOCX não encontrado: {docx}")

    spells = parse_docx_spells(docx)
    if not spells:
        raise SystemExit("Nenhuma magia (0/1/2) foi extraída do DOCX")

    counts = Counter(s.level for s in spells)
    print(f"Extraídas {len(spells)} magias do DOCX | níveis: 0={counts.get(0,0)} 1={counts.get(1,0)} 2={counts.get(2,0)}")

    if pdf.exists():
        try:
            pdf_names = parse_pdf_spell_names(pdf)
            docx_names = {s.name for s in spells}
            missing = sorted(pdf_names - docx_names)
            extra = sorted(docx_names - pdf_names)
            print(f"Validação DOCX vs PDF | faltando={len(missing)} extras={len(extra)}")
            if missing:
                print("Faltando no DOCX:")
                for item in missing:
                    print(f" - {item}")
            if extra:
                print("Extras no DOCX:")
                for item in extra:
                    print(f" - {item}")
        except RuntimeError as err:
            print(f"Aviso: validação cruzada PDF indisponível ({err})")

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as fh:
        json.dump([asdict(s) for s in spells], fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print(f"Dataset gerado em: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
