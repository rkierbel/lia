#!/usr/bin/env python3
import argparse
import PyPDF2

def main():
    parser = argparse.ArgumentParser(description='Split a PDF based on a page range.')
    parser.add_argument('input', help='Path to the input PDF file')
    parser.add_argument('start', type=int, help='Start page number (inclusive)')
    parser.add_argument('end', type=int, help='End page number (inclusive)')
    parser.add_argument('output', help='Path to the output PDF file')
    args = parser.parse_args()

    # Open the input PDF file
    with open(args.input, 'rb') as infile:
        pdf_reader = PyPDF2.PdfReader(infile)
        total_pages = len(pdf_reader.pages)

        # Check if the PDF is encrypted
        if pdf_reader.is_encrypted:
            print("Error: The PDF file is encrypted and cannot be processed.")
            return

        # Validate page numbers
        if args.start < 1 or args.end < 1:
            print("Error: Page numbers must be positive integers.")
            return
        if args.start > args.end:
            print("Error: Start page cannot be greater than end page.")
            return
        if args.end > total_pages:
            print(f"Error: End page exceeds total number of pages ({total_pages}).")
            return

        # Extract the specified page range
        pdf_writer = PyPDF2.PdfWriter()
        for page in pdf_reader.pages[args.start - 1 : args.end]:
            pdf_writer.add_page(page)

        # Save the output PDF
        with open(args.output, 'wb') as outfile:
            pdf_writer.write(outfile)

    print(f"Successfully extracted pages {args.start}-{args.end} to '{args.output}'.")

if __name__ == "__main__":
    main()