// leef_decoder_logic.js

/**
 * Parses raw LEEF log text and extracts all unique fields and their sample values.
 * @param {string} rawLogs - The string containing one or more LEEF logs.
 * @returns {Map<string, Set<string>>} - A map where keys are field names and values are a Set of sample values.
 */
function extractLEEFFields(rawLogs) {
    const lines = rawLogs.split(/\n|\r/).filter(Boolean);
    const extractedFields = new Map();

    lines.forEach(line => {
        const leefStart = line.indexOf("LEEF:");
        if (leefStart === -1) return;

        const leefContent = line.substring(leefStart + 5);
        const parts = leefContent.split('|');
        if (parts.length < 6) return;

        const attributes = parts.slice(5).join('|');
        const pairs = attributes.split(/(?<!\\)\t/g); // Split by unescaped tab

        pairs.forEach(p => {
            const [key, ...valParts] = p.split("=");
            if (!key || !valParts.length) return;

            let val = valParts.join("=").replace(/\\\|/g, '|').replace(/\\\t/g, '\t').replace(/\\\\/g, '\\').trim();
            const k = key.trim();

            if (k) {
                if (!extractedFields.has(k)) {
                    extractedFields.set(k, new Set());
                }
                extractedFields.get(k).add(val);
            }
        });
    });
    return extractedFields;
}

/**
 * Generates the full Wazuh decoder XML string for LEEF logs.
 * @param {string} logSource - The sanitized name for the log source.
 * @param {string} rawLogs - The raw logs, used to determine the prematch string.
 * @param {Map<string, string>} selectedFields - A map of selected fields { originalName: customName }.
 * @param {Map<string, Set<string>>} allExtractedFields - A map of all fields and their sample values.
 * @returns {string} - The generated XML decoder as a string.
 */
function generateLEEFDecoder(logSource, rawLogs, selectedFields, allExtractedFields) {
    
    // Helper function to escape special XML characters.
    const escapeXml = (unsafe) => {
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
            }
            return c;
        });
    };
    
    // Helper function to escape special Regex characters.
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Helper function to infer a regex pattern based on field name and sample values.
    const inferRegex = (field, sampleValues) => {
        const lower = field.toLowerCase();
        const val = [...sampleValues].find(v => v !== "") || "";

        if (field === "src" || field === "dst") return `((?:\\d{1,3}\\.){3}\\d{1,3})`;
        if (field === "filePath") return `([\\w\\\\:\\/\\.\\-\\s\\(\\)]+)`;
        if (lower.includes("url") || val.match(/^https?:\/\//)) return `(https?:\/\/[^\\s\\t]+)`;
        if (val.match(/^\d+$/)) return `(\\d+)`;
        return `([^\\t]+)`; // Default: capture everything until the next tab
    };
    
    // Determine prematch from the first log line.
    let prematch = "LEEF:";
    const firstLogLine = rawLogs.split(/\n|\r/).filter(Boolean)[0];
    if (firstLogLine) {
        const leefIndex = firstLogLine.indexOf("LEEF:");
        if (leefIndex !== -1) {
            const headerParts = firstLogLine.substring(leefIndex + 5).split('|');
            if (headerParts.length >= 2) {
                prematch = `LEEF:${escapeRegExp(headerParts[0])}\\|${escapeRegExp(headerParts[1])}`;
            }
        }
    }

    let xml = `<decoder name="${logSource}">\n`;
    xml += `  <prematch>${escapeXml(prematch)}</prematch>\n`;
    xml += `</decoder>\n\n`;

    selectedFields.forEach((customName, originalName) => {
        const sampleValues = allExtractedFields.get(originalName) || new Set();
        const pattern = inferRegex(originalName, sampleValues);
        const leefFieldRegex = `\\t${escapeRegExp(originalName)}=${pattern}`;

        xml += `<decoder name="${logSource}-child">\n`;
        xml += `  <parent>${logSource}</parent>\n`;
        xml += `  <regex type="pcre2">.*?${leefFieldRegex}</regex>\n`;
        xml += `  <order>${escapeXml(customName)}</order>\n`;
        xml += `</decoder>\n\n`;
    });

    return xml.trim();
}
