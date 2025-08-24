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
        const allSegments = leefContent.split('|');

        let extensionStartIndex = -1;
        for (let i = 0; i < allSegments.length; i++) {
            if (allSegments[i].includes('=')) {
                extensionStartIndex = i;
                break;
            }
        }

        if (extensionStartIndex === -1) return;

        let extension = allSegments.slice(extensionStartIndex).join('|');
        extension = extension.replace(/\\t/g, '\t');
        if (!extension.trim()) return;
        
        const pairs = extension.split(/(?<!\\)[\t^]/g);

        pairs.forEach(p => {
            const [key, ...valParts] = p.split("=");
            if (!key || !valParts.length) return;
            let val = valParts.join("=").replace(/\\\|/g, '|').replace(/\\\\/g, '\\').trim();
            const k = key.trim();
            if (!k) return;

            if (!extractedFields.has(k)) {
                extractedFields.set(k, new Set());
            }
            extractedFields.get(k).add(val);
        });
    });
    return extractedFields;
}


/**
 * Infers the prematch string by finding the longest common header from all raw LEEF logs.
 * @param {string} rawLogs - The string containing one or more LEEF logs.
 * @returns {string} - The inferred prematch string.
 */
function inferLEEFPrematch(rawLogs) {
    const lines = rawLogs.split(/\n|\r/).filter(Boolean);
    if (!lines.length) return "LEEF:2.0";

    const coreMessages = lines.map(line => {
        const leefIndex = line.indexOf("LEEF:");
        return leefIndex !== -1 ? line.substring(leefIndex) : "";
    }).filter(Boolean);

    if (!coreMessages.length) return "LEEF:2.0";

    let commonPrefix = "";
    const firstLine = coreMessages[0];
    for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        for (let j = 1; j < coreMessages.length; j++) {
            if (i >= coreMessages[j].length || coreMessages[j][i] !== char) {
                const lastPipe = commonPrefix.lastIndexOf('|');
                return lastPipe !== -1 ? commonPrefix.substring(0, lastPipe + 1) : "LEEF:2.0";
            }
        }
        commonPrefix += char;
    }
    
    const lastPipe = commonPrefix.lastIndexOf('|');
    return lastPipe !== -1 ? commonPrefix.substring(0, lastPipe + 1) : "LEEF:2.0";
}


/**
 * Generates the full Wazuh decoder XML string for LEEF logs.
 * @param {string} logSource - The sanitized name for the log source.
 * @param {string} prematchString - The prematch string to use in the parent decoder.
 * @param {Map<string, string>} selectedFields - A map of selected fields { originalName: customName }.
 * @param {Map<string, Set<string>>} allExtractedFields - A map of all fields and their sample values.
 * @returns {string} - The generated XML decoder as a string.
 */
function generateLEEFDecoder(logSource, prematchString, selectedFields, allExtractedFields) {
    
    const escapeXml = (unsafe) => unsafe.replace(/[<>&'"]/g, c => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '"':'&quot;'}[c]));
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const inferRegex = (field, sampleValues) => {
        const lower = field.toLowerCase();
        const val = [...sampleValues].find(v => v !== "") || "";
        if (field === "src" || field === "dst" || lower.includes("ipaddress")) return `((?:\\d{1,3}\\.){3}\\d{1,3})`;
        if (lower.includes("path") || field === "filePath") return `([\\w\\\\:\\/\\.\\-\\s\\(\\)]+)`;
        if (lower.includes("url") || val.match(/^https?:\/\//)) return `(https?:\/\/[^\\s\\t^]+)`;
        if (val.match(/^\d+$/)) return `(\\d+)`;
        return `((?:[^\\\\\\t^]|\\\\[\\t^])+?)`; 
    };
    
    let xml = `<decoder name="${logSource}">\n`;
    xml += `  <prematch>${escapeXml(prematchString)}</prematch>\n`;
    xml += `</decoder>\n\n`;

    selectedFields.forEach((customName, originalName) => {
        const sampleValues = allExtractedFields.get(originalName) || new Set();
        const pattern = inferRegex(originalName, sampleValues);
        const leefFieldRegex = `(?:^|\\t|\\^)${escapeRegExp(originalName)}=${pattern}`;

        xml += `<decoder name="${logSource}-child">\n`;
        xml += `  <parent>${logSource}</parent>\n`;
        xml += `  <regex type="pcre2">.*?${leefFieldRegex}</regex>\n`;
        xml += `  <order>${escapeXml(customName)}</order>\n`;
        xml += `</decoder>\n\n`;
    });

    return xml.trim();
}

/**
 * Generates an advanced, single-child Wazuh decoder XML string for LEEF logs.
 * @param {string} logSource - The sanitized name for the log source.
 * @param {string} prematchString - The prematch string to use in the parent decoder.
 * @param {Map<string, string>} selectedFields - A map of selected fields { originalName: customName }.
 * @param {Map<string, Set<string>>} allExtractedFields - A map of all fields and their sample values.
 * @returns {string} - The generated XML decoder as a string.
 */
function generateAdvancedLEEFDecoder(logSource, prematchString, selectedFields, allExtractedFields) {
    const escapeXml = (unsafe) => unsafe.replace(/[<>&'"]/g, c => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '"':'&quot;'}[c]));
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const inferRegex = (field, sampleValues) => {
        const lower = field.toLowerCase();
        const val = [...sampleValues].find(v => v !== "") || "";
        if (field === "src" || field === "dst" || lower.includes("ipaddress")) return `((?:\\d{1,3}\\.){3}\\d{1,3})`;
        if (lower.includes("path") || field === "filePath") return `([\\w\\\\:\\/\\.\\-\\s\\(\\)]+)`;
        if (lower.includes("url") || val.match(/^https?:\/\//)) return `(https?:\/\/[^\\s\\t^]+)`;
        if (val.match(/^\d+$/)) return `(\\d+)`;
        return `((?:[^\\\\\\t^]|\\\\[\\t^])+?)`;
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
        regexParts.push(`${escapeRegExp(originalName)}=${pattern}`);
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
