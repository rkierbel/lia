import re
from pathlib import Path
from typing import Generator, List

import pdfplumber

# Regex patterns compiled once at module level
_HEADER_FOOTER_PATTERN = re.compile(
    r"""
    ^(DOC\s+\d+|
    CHAMBRE\s+-|
    KAMER\s+-|
    \d{4}\s+[|]\s+\d{4}|
    Session\s+de|
    ZITTINGSPERIODE|
    Page\s+\d+|
    \d+\s+CHAMBRE\s+-)
    """,
    re.IGNORECASE | re.VERBOSE
)

_SECTION_PATTERN = re.compile(
    r"""
    ^(CHAPITRE|
    Chapitre|
    Section|
    Sous-section|
    HOOFDSTUK|
    Afdeling|
    HOODSTUK)\b.*
    """,
    re.IGNORECASE | re.VERBOSE
)

_ARTICLE_PATTERN = re.compile(
    r"""
    ^(?:Art(?:icle|ikel)\.?\s*          # Match "Article" or "Artikel"
        (?:\d+[\d\.\/-]*                # Match numbers like 6, 6.20, 12bis
        (?:bis|ter|quater|quinquies|sexies)?)
    )
    (?:[\s—-]|$)                       # Ensure valid termination
    """,
    re.IGNORECASE | re.VERBOSE
)

def process_pdf(input_pdf_path: Path, output_txt_path: Path) -> None:
    """
    Process PDF to extract text under article headings, excluding headers/footers and sections.
    """
    with pdfplumber.open(input_pdf_path) as pdf:
        all_paragraphs: List[str] = []

        for page in pdf.pages:
            half_width = page.width / 2
            text = page.within_bbox((0, 0, half_width, page.height)).extract_text(layout=True)

            if not text:
                continue

            processed_lines = _process_page_text(text)
            _process_articles(processed_lines, all_paragraphs)

        output_txt_path.write_text('\n'.join(all_paragraphs), encoding='utf-8')

def _process_page_text(text: str) -> Generator[str, None, None]:
    """Process page text while filtering headers/footers and sections."""
    current_paragraph: List[str] = []
    in_section = False

    for raw_line in text.split('\n'):
        line = raw_line.strip()

        if _is_header_footer(line):
            continue

        if _is_section_marker(line):
            in_section = True
            continue

        if in_section:
            if _is_article(line):
                in_section = False
            else:
                continue

        # Handle hyphenation
        if line.endswith('-'):
            current_paragraph.append(line[:-1])
        else:
            if current_paragraph:
                current_paragraph.append(line)
                yield ''.join(current_paragraph)
                current_paragraph.clear()
            else:
                yield line

    if current_paragraph:
        yield ''.join(current_paragraph)

def _process_articles(lines: Generator[str, None, None], output: List[str]) -> None:
    """Process lines to aggregate text under article headings."""
    article_buffer: List[str] = []

    for line in lines:
        if _is_article(line):
            if article_buffer:
                output.append(' '.join(article_buffer))
            output.append(f'#### {line}')  # Mark article headings
            article_buffer.clear()
        else:
            sentences = re.split(r'(?<=[.!?])\s+', line)
            cleaned = [s.replace('\n', ' ').strip() for s in sentences if s.strip()]
            article_buffer.extend(cleaned)

    if article_buffer:
        output.append(' '.join(article_buffer))

def _is_header_footer(text: str) -> bool:
    return bool(_HEADER_FOOTER_PATTERN.match(text))

def _is_section_marker(text: str) -> bool:
    return bool(_SECTION_PATTERN.match(text))

def _is_article(text: str) -> bool:
    return bool(_ARTICLE_PATTERN.match(text))

if __name__ == '__main__':
    input_pdf = Path('split.pdf')
    output_txt = Path('output12.txt')
    process_pdf(input_pdf, output_txt)