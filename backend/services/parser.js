const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Extracts raw text from an uploaded file buffer.
 * @param {Object} file - The file object from multer (needs .buffer and .originalname).
 * @returns {Promise<string>} - The extracted text.
 */
async function extractText(file) {
    if (!file || !file.buffer) {
        throw new Error('No file buffer provided.');
    }

    const ext = path.extname(file.originalname).toLowerCase();

    try {
        if (ext === '.pdf') {
            const data = await pdfParse(file.buffer);
            console.log(`[Parser] Extracted ${data.text.length} chars from PDF: ${file.originalname}`);
            return data.text;

        } else if (ext === '.docx') {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            console.log(`[Parser] Extracted ${result.value.length} chars from DOCX: ${file.originalname}`);
            return result.value;

        } else if (ext === '.txt') {
            // Basic support for txt files if needed in future, though not primary
            return file.buffer.toString('utf8');
        }

        throw new Error(`Unsupported file type: ${ext}`);
    } catch (error) {
        console.error(`[Parser] Error processing file ${file.originalname}:`, error);
        throw new Error('Failed to extract text from file.');
    }
}

module.exports = { extractText };
