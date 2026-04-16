import pdfplumber
import os
import sys

def extract_text_with_layout(pdf_path):
    """
    Extracts text from a PDF, attempting to preserve layout order (handles columns).

    Args:
        pdf_path (str): The full path to the PDF file.

    Returns:
        str: The extracted text from all pages, or None if an error occurs.
    """
    all_text = ""
    print(f"Attempting to open: {pdf_path}")
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return None
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Successfully opened {pdf_path}. Processing {len(pdf.pages)} pages...")
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text(x_tolerance=2, y_tolerance=2)
                if page_text:
                    # Optional: Add page number markers if you want them IN the text
                    # all_text += f"--- PAGE {i+1} ---\n"
                    all_text += page_text.strip()
                    all_text += "\n\n" # Add double newline between pages for structure
                else:
                    print(f"Warning: No text extracted from page {i+1} of {os.path.basename(pdf_path)}")
            print(f"Finished processing {os.path.basename(pdf_path)}.")
        return all_text
    except Exception as e:
        print(f"An error occurred while processing {pdf_path}: {e}")
        return None

def save_text_to_file(text, output_filename):
    """Saves the given text to a file."""
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Successfully saved text to {output_filename}")
    except Exception as e:
        print(f"Error saving text to {output_filename}: {e}")

# --- Configuration ---
script_directory = os.path.dirname(os.path.abspath(sys.argv[0]))
pdf_directory = script_directory # Busca los PDFs en la misma carpeta que el script
output_directory = script_directory # Guarda los TXT en la misma carpeta

pdf_files = [
    "dictameninfogeneral.pdf",
    "g-extra-1862.pdf",
    "VersiondefinitivaRGE.pdf"
]

# --- Main Processing Loop ---
print("Starting PDF text extraction...")
extracted_reglamentos = {} # Keep this if you need the text in memory immediately

# Create output directory if it doesn't exist (optional, useful if saving elsewhere)
# os.makedirs(output_directory, exist_ok=True)

for pdf_file in pdf_files:
    full_path = os.path.join(pdf_directory, pdf_file)
    extracted_text = extract_text_with_layout(full_path)
    if extracted_text:
        extracted_reglamentos[pdf_file] = extracted_text # Store in memory (optional)

        # --- SAVE TO FILE ---
        base_filename = os.path.splitext(pdf_file)[0] # Get filename without .pdf
        output_txt_filename = os.path.join(output_directory, f"{base_filename}_extracted.txt")
        save_text_to_file(extracted_text, output_txt_filename)
        # --- END SAVE TO FILE ---

    else:
        print(f"Failed to extract text for {pdf_file}")

print("\nExtraction and saving complete.")

# --- How to Access the Text (Now from files in the next script) ---
# You no longer primarily rely on the 'extracted_reglamentos' dictionary
# for the next steps. You'll load from the saved .txt files.