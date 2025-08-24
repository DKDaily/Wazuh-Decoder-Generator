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
 * Infers the prematch string by finding the longest common header from all raw CEF logs.
 * @param {string} rawLogs - The string containing one or more CEF logs.
 * @returns {string} - The inferred prematch string.
 */
function inferCEFPrematch(rawLogs) {
    const lines = rawLogs.split(/\n|\r/).filter(Boolean);
    if (!lines.length) return "CEF:0";

    const coreMessages = lines.map(line => {
        const cefIndex = line.indexOf("CEF:");
        return cefIndex !== -1 ? line.substring(cefIndex) : "";
    }).filter(Boolean);

    if (!coreMessages.length) return "CEF:0";

    let commonPrefix = "";
    const firstLine = coreMessages[0];
    for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        for (let j = 1; j < coreMessages.length; j++) {
            if (i >= coreMessages[j].length || coreMessages[j][i] !== char) {
                const lastPipe = commonPrefix.lastIndexOf('|');
                return lastPipe !== -1 ? commonPrefix.substring(0, lastPipe + 1) : "CEF:0";
            }
        }
        commonPrefix += char;
    }
    
    const lastPipe = commonPrefix.lastIndexOf('|');
    return lastPipe !== -1 ? commonPrefix.substring(0, lastPipe + 1) : "CEF:0";
}


/**
 * Generates the full Wazuh decoder XML string for CEF logs.
 * @param {string} logSource - The sanitized name for the log source.
 * @param {string} prematchString - The prematch string to use in the parent decoder.
 * @param {Map<string, string>} selectedFields - A map of selected fields { originalName: customName }.
 * @param {Map<string, Set<string>>} allExtractedFields - A map of all fields and their sample values.
 * @returns {string} - The generated XML decoder as a string.
 */
function generateCEFDecoder(logSource, prematchString, selectedFields, allExtractedFields) {

    const escapeXml = (unsafe) => unsafe.replace(/[<>&'"]/g, c => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '"':'&quot;'}[c]));
    const inferRegex = (field, sampleValues) => {
        const lower = field.toLowerCase();
        const val = [...sampleValues].find(v => v !== "") || "";
        if (lower.includes("url") || val.match(/^https?:\/\//)) return `(https?:\/\/[^\\s]+)`;
        if (lower.includes("path") || val.match(/[A-Z]:\\|\/|[\/\\\\]/) || field === "sproc") return `([\\w\\\\:\\/\\.\\-\\s\\(\\)]+)`;
        if (lower.includes("ip") || val.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) return `((?:\\d{1,3}\\.){3}\\d{1,3})`;
        if (lower.includes("email") || val.includes("@")) return `([\\w.-]+@[\\w.-]+(?:\\.[\\w.-]+)+)`;
        if (val.match(/^\d+$/)) return `(\\d+)`;
        if (field === "TMCMLogTarget") return `([\\w.]+)`;
        return `([^\\s=]+)`;
    };
    
    let xml = `<decoder name="${logSource}">\n`;
    xml += `  <prematch>${escapeXml(prematchString)}</prematch>\n`;
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

/**
 * Generates an advanced, single-child Wazuh decoder XML string for CEF logs.
 * @param {string} logSource - The sanitized name for the log source.
 * @param {string} prematchString - The prematch string to use in the parent decoder.
 * @param {Map<string, string>} selectedFields - A map of selected fields { originalName: customName }.
 * @param {Map<string, Set<string>>} allExtractedFields - A map of all fields and their sample values.
 * @returns {string} - The generated XML decoder as a string.
 */
function generateAdvancedCEFDecoder(logSource, prematchString, selectedFields, allExtractedFields) {
    const escapeXml = (unsafe) => unsafe.replace(/[<>&'"]/g, c => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '"':'&quot;'}[c]));
    const inferRegex = (field, sampleValues) => {
        const lower = field.toLowerCase();
        const val = [...sampleValues].find(v => v !== "") || "";
        if (lower.includes("url") || val.match(/^https?:\/\//)) return `(https?:\/\/[^\\s]+)`;
        if (lower.includes("path") || val.match(/[A-Z]:\\|\/|[\/\\\\]/) || field === "sproc") return `([\\w\\\\:\\/\\.\\-\\s\\(\\)]+)`;
        if (lower.includes("ip") || val.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) return `((?:\\d{1,3}\\.){3}\\d{1,3})`;
        if (lower.includes("email") || val.includes("@")) return `([\\w.-]+@[\\w.-]+(?:\\.[\\w.-]+)+)`;
        if (val.match(/^\d+$/)) return `(\\d+)`;
        if (field === "TMCMLogTarget") return `([\\w.]+)`;
        return `([^\\s=]+)`;
    };
    
    let xml = `<decoder name="${logSource}">\n`;
    xml += `  <prematch>${escapeXml(prematchString)}</prematch>\n`;
    xml += `</decoder>\n\n`;

    const regexParts = [];
    const orderParts = [];

    // ** BUG FIX: Changed "selected" to "selectedFields" **
    selectedFields.forEach((customName, originalName) => {
        const sampleValues = allExtractedFields.get(originalName) || new Set();
        const pattern = inferRegex(originalName, sampleValues);
        regexParts.push(`${escapeXml(originalName)}=${pattern}`);
        orderParts.push(escapeXml(customName));
    });

    if (regexParts.length > 0) {
        const combinedRegex = regexParts.join('.*?'); 
        const combinedOrder = orderParts.join(', ');

        xml += `<decoder name="${logSource}-child">\n`;
        xml += `  <parent>${logSource}</parent>\n`;
        xml += `  <regex type="pcre2">.*?${combinedRegex}</regex>\n`;
        xml += `  <order>${combinedOrder}</order>\n`;
        xml += `</decoder>\n\n`;
    }

    return xml.trim();
}
