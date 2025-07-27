// cef_decoder_logic.js

/**
 * Parses raw CEF log text and extracts all unique fields and their sample values.
 * @param {string} rawLogs - The string containing one or more CEF logs.
 * @returns {Map<string, Set<string>>} - A map where keys are field names and values are a Set of sample values.
 */
function extractCEFFields(rawLogs) {
    const lines = rawLogs.split(/\n|\r/).filter(Boolean);
    const extractedFields = new Map();

    lines.forEach(line => {
        const cefStart = line.indexOf("CEF:");
        if (cefStart === -1) return;

        const cef = line.substring(cefStart + 4);
        const lastPipeIndex = cef.lastIndexOf("|");
        if (lastPipeIndex === -1 || lastPipeIndex === cef.length - 1) return;

        const extension = cef.substring(lastPipeIndex + 1);
        const pairs = extension.split(/ (?=[\w.-]+=)/g);

        pairs.forEach(p => {
            const [key, ...valParts] = p.split("=");
            if (!key || !valParts.length) return;

            const val = valParts.join("=").trim();
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
 * Generates the full Wazuh decoder XML string for CEF logs.
 * @param {string} logSource - The sanitized name for the log source.
 * @param {string} rawLogs - The raw logs, used to determine the prematch string.
 * @param {Map<string, string>} selectedFields - A map of selected fields { originalName: customName }.
 * @param {Map<string, Set<string>>} allExtractedFields - A map of all fields and their sample values.
 * @returns {string} - The generated XML decoder as a string.
 */
function generateCEFDecoder(logSource, rawLogs, selectedFields, allExtractedFields) {

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
    
    // Helper function to infer a regex pattern based on field name and sample values.
    const inferRegex = (field, sampleValues) => {
        const lower = field.toLowerCase();
        const val = [...sampleValues].find(v => v !== "") || "";

        if (lower.includes("url") || val.match(/^https?:\/\//)) return `(https?:\/\/[^\\s]+)`;
        if (lower.includes("path") || val.match(/[A-Z]:\\|\/|[\/\\\\]/) || field === "sproc") return `([\\w\\\\:\\/\\.\\-\\s\\(\\)]+)`;
        if (lower.includes("ip") || val.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) return `((?:\\d{1,3}\\.){3}\\d{1,3})`;
        if (lower.includes("email") || val.includes("@")) return `([\\w.-]+@[\\w.-]+(?:\\.[\\w.-]+)+)`;
        if (val.match(/^\d+$/)) return `(\\d+)`;
        if (field === "TMCMLogTarget") return `([\\w.]+)`;
        return `([^\\s=]+)`; // Default: capture non-space and non-equals characters
    };

    // Determine prematch from the first log line.
    let prematch = "CEF:";
    const firstLogLine = rawLogs.split(/\n|\r/).filter(Boolean)[0];
    if (firstLogLine) {
        const cefIndex = firstLogLine.indexOf("CEF:");
        if (cefIndex > 0) {
            const partBeforeCef = firstLogLine.substring(0, cefIndex).trim();
            const parts = partBeforeCef.split(/\s+/);
            prematch = (parts.length > 0 ? parts[parts.length - 1] : '') + " CEF:";
        }
    }
    
    let xml = `<decoder name="${logSource}">\n`;
    xml += `  <prematch>${escapeXml(prematch)}</prematch>\n`;
    xml += `</decoder>\n\n`;

    selectedFields.forEach((customName, originalName) => {
        const sampleValues = allExtractedFields.get(originalName) || new Set();
        const pattern = inferRegex(originalName, sampleValues);
        
        xml += `<decoder name="${logSource}-child">\n`;
        xml += `  <parent>${logSource}</parent>\n`;
        xml += `  <regex type="pcre2">.*?${escapeXml(originalName)}=${pattern}</regex>\n`;
        xml += `  <order>${escapeXml(customName)}</order>\n`;
        xml += `</decoder>\n\n`;
    });

    return xml.trim();
}
