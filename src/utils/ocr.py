import pytesseract
from PIL import Image
import pdfplumber
from docx import Document as DocxDocument
import os

def extract_text_from_image(image_path, lang='eng'):
    """Extract text from an image using Tesseract OCR."""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang=lang)
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from image: {str(e)}")

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file using pdfplumber."""
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def extract_text_from_docx(docx_path):
    """Extract text from a DOCX file."""
    try:
        doc = DocxDocument(docx_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from DOCX: {str(e)}")

def detect_language(text):
    """Detect the language of the text (simplified version)."""
    # This is a simplified version. In production, use a proper language detection library
    # like langdetect or polyglot
    if any(ord(char) >= 0x0400 and ord(char) <= 0x04FF for char in text[:100]):
        return 'rus'  # Russian (Cyrillic)
    return 'eng'  # Default to English

def process_file_ocr(file_path, mime_type):
    """Process a file and extract text based on its MIME type."""
    text = ""
    lang = 'eng'
    
    try:
        if mime_type == 'application/pdf':
            text = extract_text_from_pdf(file_path)
        elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            text = extract_text_from_docx(file_path)
        elif mime_type.startswith('image/'):
            # Detect language first (simplified)
            lang = 'eng+rus'  # Support multiple languages
            text = extract_text_from_image(file_path, lang=lang)
        else:
            raise Exception(f"Unsupported file type: {mime_type}")
        
        # Post-processing: remove extra whitespace and normalize
        text = "\n".join([line.strip() for line in text.split("\n") if line.strip()])
        
        # Detect language from extracted text
        detected_lang = detect_language(text)
        
        return {
            'text': text,
            'language': detected_lang,
            'status': 'success'
        }
    except Exception as e:
        return {
            'text': '',
            'language': 'unknown',
            'status': 'failed',
            'error': str(e)
        }

