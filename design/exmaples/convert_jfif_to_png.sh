#!/bin/bash

set -euo pipefail

if ! command -v magick >/dev/null 2>&1; then
	echo "Error: ImageMagick 'magick' command not found in PATH."
	echo "Install ImageMagick and ensure 'magick' is available."
	exit 1
fi

shopt -s nullglob
files=(*.jfif *.JFIF)

if [ ${#files[@]} -eq 0 ]; then
	echo "No .jfif files found in current directory."
	exit 0
fi

for file in "${files[@]}"; do
	png_file="${file%.*}.png"
	magick "$file" "$png_file"
	echo "Converted: $file -> $png_file"
done
