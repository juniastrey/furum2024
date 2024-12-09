import os
import subprocess
from concurrent.futures import ThreadPoolExecutor

# Define the input directory
input_dir = "svgs"


# Function to run the command for a given file
def process_file(args):
    try:
        # Run the command-line program with the file as an argument
        subprocess.run(args, check=True)
        print(f"Processed: {args}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to process {args}: {e}")


args = []
for filename in os.listdir("svgs"):
    input_path = os.path.join(input_dir, filename)

    # Check if the file is a valid image (you can customize this check as needed)
    if os.path.isfile(input_path) and filename.lower().endswith((".svg")):
        # Construct the output filename with an .svg extension
        name = os.path.splitext(filename)[0]
        args.append(
            [
                "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD",
                "-D",
                f'name="{name}"',
                "-D",
                "glow=false",
                "-o",
                f"stls/{name}.stl",
                "--enable",
                "textmetrics",
                "keychain.scad",
            ]
        )
        args.append(
            [
                "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD",
                "-D",
                f'name="{name}"',
                "-D",
                "glow=true",
                "-o",
                f"stls/{name}_glow.stl",
                "--enable",
                "textmetrics",
                "keychain.scad",
            ]
        )


# Run the program in parallel using ThreadPoolExecutor
with ThreadPoolExecutor() as executor:
    executor.map(process_file, args)

print("Processing completed.")
