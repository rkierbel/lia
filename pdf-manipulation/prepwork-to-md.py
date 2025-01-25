#!/usr/bin/env python3
import re
import argparse
import pdfplumber

def extract_french_text(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join([
            page.crop((0, 0, page.width/2, page.height))
            .extract_text()
            .replace('\n', ' ')
            for page in pdf.pages
        ])

def fix_hyphenation(text):
    return re.sub(r'-\s+(\w)', r'\1', text)

def chunk_text(text, max_length=2000):
    chunks = []
    current_chunk = []
    current_length = 0

    parts = re.split(r'(?<=[.!?]) (?=[A-ZÀ-Ÿ])', text)

    for part in parts:
        clean_part = part.strip()
        if not clean_part:
            continue

        part_length = len(clean_part)

        if current_length + part_length > max_length:
            chunks.append(" ".join(current_chunk))
            # Prepare next chunk with the last sentence of the current chunk
            if current_chunk:
                last_part = current_chunk[-1]
                current_chunk = [last_part]
                current_length = len(last_part)
            else:
                current_chunk = []
                current_length = 0

            current_chunk.append(clean_part)
            current_length += part_length
        else:
            current_chunk.append(clean_part)
            current_length += part_length

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

def main():
    parser = argparse.ArgumentParser(description='Extract French text from PDF left column')
    parser.add_argument('input_pdf', help='Input PDF path')
    parser.add_argument('output_md', help='Output markdown path')
    args = parser.parse_args()

    raw_text = extract_french_text(args.input_pdf)
    cleaned_text = fix_hyphenation(raw_text)
    chunks = chunk_text(cleaned_text)

    with open(args.output_md, 'w', encoding='utf-8') as f:
        f.write('\n####\n'.join(chunks))

if __name__ == "__main__":
    main()