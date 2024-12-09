import os
import subprocess
import mimetypes
import requests
import pdfgen, pdfgen2
import time
import websocket
from flask import Flask, render_template, request, jsonify
from pixelblaze import *
from PIL import Image, ExifTags

app = Flask(__name__)

bmaus = None
cmaus = None

bmaus_patterns = [
    "Custom: Off",
    "Example: Smooth Speed Slider",
    "KITT",
    "xorcery 2D/3D",
    "fast pulse 2D/3D",
    "edgeburst",
]
bmaus_dict = {}

cmaus_patterns = [
    "Custom: Off",
    "Custom: Rainbow",
    "Custom: KITT",
    "xorcery 2D/3D",
    "fast pulse 2D/3D",
    "Custom: Blinky Eyes",
    "Custom: Scrolling Text",
]
cmaus_dict = {}

e = PixelblazeEnumerator()


try:
    IS_DEVTERM = (
        b"devterm_printer"
        in subprocess.run(["lpstat", "-p"], capture_output=True).stdout
    )
except:
    IS_DEVTERM = False


def print_file(filename, media="X48MMY210MM"):
    if IS_DEVTERM:
        os.system(
            f"lp -d devterm_printer -o media={media} -o fit-to-page -o BlankSpace=True {filename}"
        )


def init_pixelblazes():
    global bmaus, cmaus, bmaus_dict, cmaus_dict
    bmaus = None
    cmaus = None
    bmaus_dict = {}
    cmaus_dict = {}

    time.sleep(2)
    l = e.getPixelblazeList()

    for addr in l:
        p = Pixelblaze(addr)
        if p.getDeviceName() == "bmaus":
            bmaus = p
            bmaus_dict = dict(
                (value, key) for key, value in bmaus.getPatternList().items()
            )
        elif p.getDeviceName() == "cmaus":
            cmaus = p
            cmaus_dict = dict(
                (value, key) for key, value in cmaus.getPatternList().items()
            )
        else:
            print(f"Unrecognised Pixelblaze '{p.getDeviceName()}' found at {addr}")


@app.route("/")
def home():
    return render_template(
        "index.html",
        apikey=os.environ["GOOGLE_API_KEY"],
        engineid=os.environ["GOOGLE_ENGINE_ID"],
    )


@app.route("/mobile")
def mobile():
    return render_template(
        "mobile.html",
        apikey=os.environ["GOOGLE_API_KEY"],
        engineid=os.environ["GOOGLE_ENGINE_ID"],
    )


@app.route("/ears")
def ears():
    key = request.args.get("key", "")
    if key.isdigit():
        key = int(key)
        if key < len(bmaus_patterns):
            pattern_id = bmaus_dict.get(bmaus_patterns[key])
            if pattern_id:
                bmaus.setActivePattern(pattern_id)
    return "OK", 200


@app.route("/eyes")
def eyes():
    key = request.args.get("key", "")
    if key.isdigit():
        key = int(key)
        if key < len(cmaus_patterns):
            pattern_id = cmaus_dict.get(cmaus_patterns[key])
            if pattern_id:
                cmaus.setActivePattern(pattern_id)
                if key == 6:
                    msg = request.args.get("msg", "").upper()
                    cmaus.setActiveVariables(
                        {
                            "message": [
                                ord(msg[i]) if i < len(msg) else ord(" ")
                                for i in range(12)
                            ]
                        }
                    )
    return "OK", 200


@app.route("/both")
def both():
    key = request.args.get("key", "")
    if key.isdigit():
        key = int(key)
        if key < len(bmaus_patterns) and key < len(cmaus_patterns):
            b_pattern_id = bmaus_dict.get(bmaus_patterns[key])
            c_pattern_id = cmaus_dict.get(cmaus_patterns[key])
            if b_pattern_id and c_pattern_id:
                bmaus.setActivePattern(b_pattern_id)
                cmaus.setActivePattern(c_pattern_id)
    return "OK", 200


@app.route("/print")
def print_view():
    msg = request.args.get("msg", "")
    pdfgen.create_pdf(msg)
    print_file("output.pdf")
    return "OK", 200


@app.route("/print2")
def print2_view():
    user = request.args.get("user", "")
    image = request.args.get("image", "")
    offence = request.args.get("offence", "")
    response = requests.get(image)
    filename = "profile" + mimetypes.guess_extension(response.headers["Content-Type"])
    with open(filename, "wb") as f:
        f.write(response.content)
    pdfgen2.create_pdf(user, filename, offence)
    print_file("output.pdf")
    return "OK", 200


@app.route("/upload", methods=["POST"])
def upload():
    user = request.args.get("user", "")
    image = request.files["upload"]
    offence = request.args.get("offence", "")
    filename = "profile" + mimetypes.guess_extension(image.mimetype)
    image.save(filename)
    try:
        image = Image.open(filename)

        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == "Orientation":
                break

        exif = image._getexif()

        if exif[orientation] == 3:
            image = image.rotate(180, expand=True)
        elif exif[orientation] == 6:
            image = image.rotate(270, expand=True)
        elif exif[orientation] == 8:
            image = image.rotate(90, expand=True)

        image.save(filename)
        image.close()
    except (AttributeError, KeyError, IndexError):
        # cases: image don't have getexif
        pass
    pdfgen2.create_pdf(user, filename, offence)
    print_file("output.pdf")
    return "OK", 200


@app.route("/init")
def init():
    init_pixelblazes()
    return "OK", 200


@app.errorhandler(websocket.WebSocketException)
def handle(e):
    print(e)
    try:
        init_pixelblazes()
    except:
        pass
    return "WebSocketException", 500


if __name__ == "__main__":
    init_pixelblazes()
    app.run(host="0.0.0.0", port=8000)
