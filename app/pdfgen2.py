import os
import subprocess
import sys
import random

from fpdf import FPDF

PAGE_WIDTH = 48
PAGE_HEIGHT = 210

MARGIN = 0
TEXT_WIDTH = PAGE_WIDTH - 2 * MARGIN
TOLERANCE = 0.1

OUTPUT_FILENAME = "output.pdf"

NUMBERS = [42, 69, 420, 1337]

PENALTIES = [
    "{} DEMERIT PTS",
    "-{}% EXP",
]

def open_file(filename):
    if sys.platform == "win32":
        os.startfile(filename)
    elif sys.platform == "darwin":
        subprocess.call(["open", filename])
    else:
        subprocess.call(["xdg-open", filename])


def create_pdf(user, image, offence, outfile=OUTPUT_FILENAME):
    # Create instance of FPDF class
    pdf = FPDF(unit="mm", format=(PAGE_WIDTH, PAGE_HEIGHT))

    pdf.set_margins(MARGIN, MARGIN)

    # Add a page
    pdf.add_page()

    pdf.set_font("Arial", "B", size=12)
    pdf.set_text_color(255)
    pdf.set_fill_color(0)
    pdf.cell(0, 5, "VIOLATION", 0, 1, "C", True)

    pdf.set_text_color(0)
    pdf.set_font("Arial", "B", size=8)
    pdf.cell(10, 6, "NAME")
    pdf.set_font("Arial", "")
    pdf.cell(0, 6, user, 0, 1)
    pdf.set_font("Arial", "B")
    pdf.cell(0, 6, "OFFENCE", "T", 1)
    pdf.set_font("Arial", "")
    pdf.multi_cell(0, 3, offence, 0, "L")

    pdf.ln(2)

    pdf.image(image, w=TEXT_WIDTH)

    pdf.set_font("Arial", "B", size=12)
    pdf.set_text_color(255)
    pdf.cell(0, 5, random.choice(PENALTIES).format(random.choice(NUMBERS)), 0, 1, "C", True)

    pdf.ln(2)

    pdf.set_text_color(0)
    pdf.set_font("Arial", "", size=6)
    pdf.cell(0, 3, "ATTENTION OFFENDER: PLEASE READ.", 0, 1)
    pdf.multi_cell(0, 2, "This document serves as official notice of your egregious violation of the Federal Unified Regulations on Unreasonable Mischief (FURUM), Section 69(b), Subsection \"IYKYK\". You have 24 hours to appeal this case to the individual who served you this ticket by performing the GravityFox dance. Failure to comply will result in a doubling of penalties and being forced to admit you don't know what \"UwU\" means in court. You have been warned.", 0, "L")

    # Save the pdf with name .pdf
    pdf.output(outfile)


if __name__ == "__main__":
    outfile = sys.argv[1] if len(sys.argv) > 1 else OUTPUT_FILENAME
    create_pdf("slyfoxlover", "profile.jpg", "Being excessively cute", outfile)
    open_file(outfile)
