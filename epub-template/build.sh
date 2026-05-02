#!/bin/bash
# ============================================
# FINNOYBU PRESS — EPUB BUILD SCRIPT
# ============================================
# Usage: ./build.sh [output-name]
# Example: ./build.sh chatgpt-definitive-guide
#
# Requirements: zip (included on macOS/Linux, install on Windows via Git Bash)
# ============================================

OUTPUT_NAME="${1:-book}"
OUTPUT_FILE="../${OUTPUT_NAME}.epub"

echo "Building EPUB: ${OUTPUT_FILE}"

# Clean previous build
rm -f "$OUTPUT_FILE"

# EPUB spec requires mimetype as first file, stored (not compressed)
cd "$(dirname "$0")"

# Create the EPUB (zip archive)
# mimetype MUST be first and uncompressed
zip -X0 "$OUTPUT_FILE" mimetype
zip -Xr9 "$OUTPUT_FILE" META-INF/ OEBPS/ -x "*.DS_Store" "*Thumbs.db"

echo ""
echo "Done! Created: ${OUTPUT_FILE}"
echo ""
echo "Validate at: https://validator.w3.org/check (or use epubcheck)"
echo "Upload to KDP: https://kdp.amazon.com"
