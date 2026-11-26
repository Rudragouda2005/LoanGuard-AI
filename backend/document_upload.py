from io import BytesIO
from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract readable text from an uploaded PDF."""

    reader = PdfReader(BytesIO(file_bytes))

    text = ""

    for page in reader.pages:
        page_text = page.extract_text() or ""
        text += page_text + "\n"

    if not text.strip():
        raise ValueError(
            "No readable text found in this PDF. "
            "It may be a scanned document."
        )

    return text.strip()