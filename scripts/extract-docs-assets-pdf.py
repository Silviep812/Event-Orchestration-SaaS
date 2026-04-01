#!/usr/bin/env python3
"""Extract text from docs/assets/*.pdf into docs/assets/_extracted/ (for local search; folder is gitignored)."""

from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    raise SystemExit("Install pypdf: pip install pypdf") from None

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "assets"
OUT = ASSETS / "_extracted"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for pdf in sorted(ASSETS.glob("*.pdf")):
        reader = PdfReader(str(pdf))
        chunks = []
        for i, page in enumerate(reader.pages):
            t = page.extract_text() or ""
            chunks.append(f"--- Page {i + 1} ---\n{t}")
        body = "\n\n".join(chunks)
        stem = pdf.stem.replace(" ", "_").replace("(", "").replace(")", "")
        (OUT / f"{stem}.txt").write_text(body, encoding="utf-8")
        print(pdf.name, "pages", len(reader.pages), "chars", len(body))


if __name__ == "__main__":
    main()
