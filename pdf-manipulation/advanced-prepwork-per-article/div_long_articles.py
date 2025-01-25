import re
import sys

def chunk_articles(input_file, output_file, max_chunk_size=4500):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split articles using more precise article header matching
    article_pattern = re.compile(
        r'(#### Article \d+\.\d+\n.*?)(?=\n#### Article \d+\.\d+|\Z)',
        re.DOTALL
    )
    articles = article_pattern.findall(content)

    processed = []

    for article in articles:
        # Split article header from content
        header_match = re.match(r'(#### Article \d+\.\d+)\n(.*)', article, re.DOTALL)
        if not header_match:
            processed.append(article.strip())
            continue

        title, body = header_match.groups()
        body = body.strip()

        if len(body) <= max_chunk_size:
            processed.append(f"{title}\n{body}")
            continue

        # Improved sentence splitting that preserves citations
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-ZÀ-ÿ])', body)
        sentences = [s.strip() for s in sentences if s.strip()]

        current_chunk = []
        current_length = 0

        for sentence in sentences:
            sentence_length = len(sentence) + 1  # +1 for newline

            if current_length + sentence_length > max_chunk_size:
                if current_chunk:
                    chunk = f"{title}\n" + ' '.join(current_chunk)
                    processed.append(chunk)
                    current_chunk = []
                    current_length = 0

            current_chunk.append(sentence)
            current_length += sentence_length

        if current_chunk:
            chunk = f"{title}\n" + ' '.join(current_chunk)
            processed.append(chunk)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(processed))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py input.md output.md")
        sys.exit(1)

    chunk_articles(sys.argv[1], sys.argv[2])