import os
from vtracer import convert_image_to_svg_py

# Define the input and output directories
input_dir = "pics"
output_dir = "svgs"

# Ensure the output directory exists
os.makedirs(output_dir, exist_ok=True)

# Iterate through all files in the input directory
for filename in os.listdir(input_dir):
    input_path = os.path.join(input_dir, filename)

    # Check if the file is a valid image (you can customize this check as needed)
    if os.path.isfile(input_path) and filename.lower().endswith((".png", ".jpg", ".jpeg", ".bmp", ".gif")):
        # Construct the output filename with an .svg extension
        output_filename = os.path.splitext(filename)[0] + ".svg"
        output_path = os.path.join(output_dir, output_filename)

        # Convert the image to SVG
        try:
            convert_image_to_svg_py(input_path, output_path, "binary")
            print(f"Converted: {input_path} -> {output_path}")
        except Exception as e:
            print(f"Failed to convert {input_path}: {e}")

print("Conversion process completed.")
