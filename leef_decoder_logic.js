// Global map to store custom field names for LEEF (used for "Selected Fields" inputs)
const leefCustomFieldMap = {};
// Global map to store all extracted fields and their sample values for LEEF (from raw logs)
let leefGlobalFieldMap = new Map();

// commonLeefFields is now loaded from common_fields.js via the window object
// const commonLeefFields = [ ... ]; // REMOVED FROM HERE

// Local helper functions for displaying and hiding error messages (duplicated for self-containment)
function displayErrorMessage(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }
}

function hideErrorMessage(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = "none";
        errorElement.textContent = "";
    }
}

/**
 * Parses LEEF logs, extracts fields, and populates the UI.
 * This function is designed to be called when LEEF is selected.
 */
function parseLEEFLogs() {
    const logs = document.getElementById("logs").value.trim();
    const lines = logs.split(/\n|\r/).filter(Boolean); // Filter out empty lines

    // Clear existing UI elements and reset maps regardless of log content
    document.getElementById("fieldList").innerHTML = "";
    document.getElementById("selectedList").innerHTML = "";
    Object.keys(leefCustomFieldMap).forEach(key => delete leefCustomFieldMap[key]); // Clear customFieldMap
    leefGlobalFieldMap.clear();
    hideErrorMessage("selectedFieldsError"); // Clear any previous error message

    if (lines.length === 0) {
        document.getElementById("fieldList").innerHTML = "<p class='text-center mt-4'>No LEEF logs detected. Please paste logs.</p>";
        return; // Exit if no valid lines
    }

    lines.forEach(line => {
        // LEEF format: LEEF:Version|Vendor|Product|Version|EventID|Attributes
        const leefStart = line.indexOf("LEEF:");
        if (leefStart === -1) return; // Skip lines that don't look like LEEF

        const leefContent = line.substring(leefStart + 5); // Get content after "LEEF:"

        // Split by pipe to get header and attributes part
        const parts = leefContent.split('|');
        if (parts.length < 6) return; // Not enough parts for a valid LEEF header

        // The last part is typically the attributes section
        const attributes = parts.slice(5).join('|'); // Re-join if pipes exist in attribute values

        // Split key-value pairs by tab, handling escaped tabs and other escaped characters
        // Regex: Split by unescaped tab. Look for tab NOT preceded by a backslash.
        const pairs = attributes.split(/(?<!\\)\t/g);

        pairs.forEach(p => {
            const [key, ...valParts] = p.split("=");
            // Ensure key exists and value parts exist before processing
            if (!key || !valParts.length) return;

            // Re-join value parts in case the value itself contained '='
            let val = valParts.join("=");
            // Unescape common LEEF escape sequences: \|, \t, \\
            val = val.replace(/\\\|/g, '|').replace(/\\\t/g, '\t').replace(/\\\\/g, '\\').trim();

            const k = key.trim();

            if (k) { // Ensure key is not empty after trimming
                if (!leefGlobalFieldMap.has(k)) leefGlobalFieldMap.set(k, new Set());
                leefGlobalFieldMap.get(k).add(val);
            }
        });
    });

    // Sort keys alphabetically
    const sortedKeys = [...leefGlobalFieldMap.keys()].sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    );

    if (sortedKeys.length === 0) {
        document.getElementById("fieldList").innerHTML = "<p class='text-center mt-4'>No LEEF fields extracted. Check log format or provide more detailed logs.</p>";
        return;
    }

    // Render extracted fields
    const fieldListDiv = document.getElementById("fieldList");
    sortedKeys.forEach(key => {
        const values = leefGlobalFieldMap.get(key);
        const allValues = Array.from(values);

        const wrapper = document.createElement("div");
        wrapper.className = "field-item";

        const label = document.createElement("span");
        label.textContent = key;
        label.className = "min-w-[140px]";

        const valueSelect = document.createElement("select");
        valueSelect.className = "input-box flex-grow mr-2";

        allValues.forEach(val => {
            const option = document.createElement("option");
            option.value = val;
            option.textContent = val;
            valueSelect.appendChild(option);
        });

        const addBtn = document.createElement("button");
        addBtn.className = "btn-primary ml-2";
        addBtn.textContent = "+";
        addBtn.dataset.key = key;

        // Set button state correctly if field was already selected from a previous parse action
        if (leefCustomFieldMap.hasOwnProperty(key)) {
            addBtn.textContent = "-";
            addBtn.classList.remove("btn-primary");
            addBtn.classList.add("btn-remove");
        }

        addBtn.onclick = () => {
            const selectedList = document.getElementById("selectedList");
            // Find existing li using the data-key for reliable toggling
            const existingLi = document.querySelector(`#selectedList li[data-key="${key}"]`);

            if (!existingLi) { // If field is NOT already selected, add it
                hideErrorMessage("selectedFieldsError"); // Clear error when adding a new one

                const li = document.createElement("li");
                li.className = "p-1 mb-8 border-b border-gray-600 flex items-center justify-between flex-wrap";
                li.dataset.key = key;

                const originalNameSpan = document.createElement("span");
                originalNameSpan.innerHTML = key + ":&nbsp;&nbsp;";
                originalNameSpan.className = "mr-4 min-w-[80px] font-bold";

                // Create the dropdown for common field mapping
                const commonFieldSelect = document.createElement("select");
                commonFieldSelect.className = "input-box flex-grow mr-2 max-w-[250px]";

                const defaultOption = document.createElement("option");
                defaultOption.value = key;
                defaultOption.textContent = key;
                commonFieldSelect.appendChild(defaultOption);

                // Use the globally available window.commonNormalizedFields
                window.commonNormalizedFields.slice(1).forEach(commonField => {
                    const option = document.createElement("option");
                    option.value = commonField.normalized;
                    option.textContent = commonField.normalized;
                    commonFieldSelect.appendChild(option);
                });

                // Create the input box for custom names
                const customNameInput = document.createElement("input");
                customNameInput.type = "text";
                customNameInput.className = "input-box flex-grow mr-2 max-w-[250px]";
                customNameInput.placeholder = "Enter custom field name";
                customNameInput.style.display = "none"; // Initially hidden

                // Set initial value for dropdown/input and customFieldMap
                let initialSelectedName = key;
                const previousCustomName = leefCustomFieldMap[key];
                if (previousCustomName) {
                    initialSelectedName = previousCustomName;
                    // Check if it's a common field or a custom one
                    const isCommon = window.commonNormalizedFields.some(f => f.normalized === previousCustomName || f.original === previousCustomName);
                    if (!isCommon) {
                        // If it's a custom name, show input and hide dropdown
                        customNameInput.value = initialSelectedName;
                        customNameInput.style.display = "block";
                        commonFieldSelect.style.display = "none";
                    } else {
                        // It's a common name, show dropdown
                        commonFieldSelect.value = initialSelectedName;
                    }
                } else {
                    const matchingCommonField = window.commonNormalizedFields.find(f => f.original === key);
                    if (matchingCommonField) {
                        initialSelectedName = matchingCommonField.normalized;
                    }
                    commonFieldSelect.value = initialSelectedName;
                }

                // Check for duplicate normalized/custom names among already selected fields
                const isDuplicateCustomName = Object.keys(leefCustomFieldMap).some(
                    (originalFieldKey) => leefCustomFieldMap[originalFieldKey] === initialSelectedName && originalFieldKey !== key
                );

                if (isDuplicateCustomName) {
                    displayErrorMessage("selectedFieldsError", `The field name "${initialSelectedName}" is already in use by another selected field. Please choose a different name.`);
                    return; // Prevent adding the duplicate
                }

                leefCustomFieldMap[key] = initialSelectedName; // Now initialize the map entry here

                // Event listener for dropdown change
                commonFieldSelect.onchange = (event) => {
                    const selectedValue = event.target.value;
                    // Validate on change to prevent immediate duplication
                    const isDuplicate = Object.keys(leefCustomFieldMap).some(
                        (originalFieldKey) => leefCustomFieldMap[originalFieldKey] === selectedValue && originalFieldKey !== key
                    );

                    if (isDuplicate) {
                        displayErrorMessage("selectedFieldsError", `The field name "${selectedValue}" is already in use by another selected field. Please choose a different name.`);
                        // Revert to the previous valid value
                        event.target.value = leefCustomFieldMap[key]; // Revert to the last valid selection
                        return;
                    }

                    hideErrorMessage("selectedFieldsError"); // Clear error if selection is valid
                    leefCustomFieldMap[key] = selectedValue; // Update customFieldMap directly
                    customNameInput.value = selectedValue; // Keep input value in sync (hidden)
                };

                // Event listener for custom input change/blur
                customNameInput.oninput = (event) => {
                    // Only update customFieldMap if the input is currently visible and being used
                    if (customNameInput.style.display !== "none") {
                        leefCustomFieldMap[key] = event.target.value.trim();
                        hideErrorMessage("selectedFieldsError"); // Clear error on input change (user is typing)
                    }
                };

                // Add an "edit" icon (e.g., a pencil)
                const editIcon = document.createElement("span");
                editIcon.className = "edit-icon mr-2";
                editIcon.innerHTML = "&#x1F58A;"; // Pen symbol 🖊
                editIcon.title = "Edit custom field name";
                editIcon.style.cursor = "pointer";

                editIcon.onclick = () => {
                    // Toggle visibility of input and dropdown
                    if (customNameInput.style.display === "none") {
                        commonFieldSelect.style.display = "none";
                        customNameInput.style.display = "block";
                        // Set input value to current mapped value (from dropdown or previous custom)
                        customNameInput.value = leefCustomFieldMap[key] || key;
                        customNameInput.focus(); // Focus the input when it appears
                        hideErrorMessage("selectedFieldsError"); // Clear error when opening edit mode
                    } else {
                        // If input is currently shown, commit its value and switch back to dropdown
                        const trimmedValue = customNameInput.value.trim();

                        // Validate before committing
                        const isDuplicate = Object.keys(leefCustomFieldMap).some(
                            (originalFieldKey) => leefCustomFieldMap[originalFieldKey] === trimmedValue && originalFieldKey !== key
                        );

                        if (isDuplicate) {
                            displayErrorMessage("selectedFieldsError", `The field name "${trimmedValue}" is already in use by another selected field. Please choose a different name.`);
                            customNameInput.focus(); // Keep focus on input for correction
                            return; // Do not commit the duplicate
                        }

                        hideErrorMessage("selectedFieldsError"); // Clear error if commitment is valid
                        leefCustomFieldMap[key] = trimmedValue;

                        // Try to set dropdown value, if not found, add a temporary option
                        if (Array.from(commonFieldSelect.options).some(opt => opt.value === trimmedValue)) {
                            commonFieldSelect.value = trimmedValue;
                        } else {
                            // If custom value is not in dropdown, add it temporarily and select it
                            const newOption = document.createElement("option");
                            newOption.value = trimmedValue;
                            newOption.textContent = trimmedValue;
                            commonFieldSelect.appendChild(newOption);
                            commonFieldSelect.value = trimmedValue;
                        }
                        customNameInput.style.display = "none";
                        commonFieldSelect.style.display = "block";
                    }
                };

                // Handle 'Enter' key press in custom input to commit change
                customNameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        editIcon.click(); // Simulate a click on the edit icon to commit and toggle back
                        e.preventDefault(); // Prevent default form submission if any
                    }
                });

                // Add blur event to commit value if user clicks away from input
                customNameInput.addEventListener('blur', () => {
                    if (customNameInput.style.display !== "none") {
                        editIcon.click(); // Commit and toggle back if still visible
                    }
                });

                const removeBtn = document.createElement("button");
                removeBtn.textContent = "x";
                removeBtn.className = "ml-2 btn-primary p-1 btn-remove";
                removeBtn.onclick = () => {
                    li.remove();
                    delete leefCustomFieldMap[key]; // Remove from customFieldMap
                    hideErrorMessage("selectedFieldsError"); // Clear error when removing a field
                    // Reset button to "+" in the extracted fields list
                    addBtn.textContent = "+";
                    addBtn.classList.remove("btn-remove");
                    addBtn.classList.add("btn-primary");
                };

                li.appendChild(originalNameSpan);
                li.appendChild(commonFieldSelect);
                li.appendChild(customNameInput); // Add the hidden input
                li.appendChild(editIcon); // Add the edit icon
                li.appendChild(removeBtn);
                selectedList.appendChild(li);

                // Change button to "-" in the extracted fields list
                addBtn.textContent = "-";
                addBtn.classList.remove("btn-primary");
                addBtn.classList.add("btn-remove");
            } else { // If field is already selected, this click acts as a "remove"
                existingLi.remove();
                delete leefCustomFieldMap[key];
                hideErrorMessage("selectedFieldsError"); // Clear error when removing a field
                addBtn.textContent = "+";
                addBtn.classList.remove("btn-remove");
                addBtn.classList.add("btn-primary");
            }
        };

        wrapper.appendChild(label);
        wrapper.appendChild(valueSelect);
        wrapper.appendChild(addBtn);
        fieldListDiv.appendChild(wrapper);
    });
}

/**
 * Infers a regex pattern for a given LEEF field based on sample values.
 * @param {string} field - The field name.
 * @param {Set<string>} sampleValues - A set of sample values for the field.
 * @returns {string} The inferred regex pattern.
 */
function inferRegexForLEEFField(field, sampleValues) {
    const lower = field.toLowerCase();
    const val = [...sampleValues].find(v => v !== "") || ""; // Prefer non-empty value

    // Specific LEEF field patterns
    if (field === "src" || field === "dst") {
        return `((?:\\d{1,3}\\.){3}\\d{1,3})`; // IP address
    } else if (field === "usrName") {
        return `([^\\t]+)`; // Username, typically doesn't contain tabs
    } else if (field === "fileName") {
        return `([^\\t]+)`; // Filename, typically doesn't contain tabs
    } else if (field === "filePath") {
        return `([\\w\\\\:\\/\\.\\-\\s\\(\\)]+)`; // Path, allows various path characters
    } else if (lower.includes("url") || val.match(/^https?:\/\//)) {
        return `(https?:\/\/[^\\s]+)`;
    } else if (val.match(/^\d+$/)) {
        return `(\\d+)`; // Pure numbers
    } else {
        // Default regex for general alphanumeric and common symbols, allowing spaces and other chars but stopping at tab
        return `([^\\t]+)`;
    }
}

/**
 * Generates the Wazuh decoder XML for LEEF logs.
 */
function generateLEEFDecoder() {
    const logSource = document.getElementById("logSource").value.trim();
    const logs = document.getElementById("logs").value.trim();
    const selectedFields = Object.keys(leefCustomFieldMap);

    // Sanitize log source name for decoder XML. Remove spaces and special characters.
    const sanitizedLogSource = logSource.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Determine LEEF prematch. A common LEEF prematch could be based on the first part of the log.
    let prematch = "LEEF:";
    const firstLogLine = logs.split(/\n|\r/).filter(Boolean)[0];
    if (firstLogLine) {
        const leefIndex = firstLogLine.indexOf("LEEF:");
        if (leefIndex !== -1) {
            // Extract the header part up to the first few pipes to make a more specific prematch
            const headerParts = firstLogLine.substring(leefIndex + 5).split('|');
            if (headerParts.length >= 2) { // At least Version|Vendor
                prematch = `LEEF:${escapeRegExp(headerParts[0])}\\|${escapeRegExp(headerParts[1])}`;
            }
        }
    }

    // Use sanitizedLogSource directly for the parent decoder name
    let xml = `<decoder name="${sanitizedLogSource}">\n`;
    xml += `  <prematch>${escapeXml(prematch)}</prematch>\n`;
    xml += `</decoder>\n\n`;

    selectedFields.forEach(field => {
        const custom = leefCustomFieldMap[field] || field;
        const values = leefGlobalFieldMap.get(field) || new Set();
        let pattern = inferRegexForLEEFField(field, values);

        // For LEEF, regex needs to account for tab delimiters and potentially escaped characters in values
        // We'll use a general regex to capture the key=value pair within the attributes section.
        // The pattern for the value will be specific to the field.
        // The regex should look for the field name, followed by '=', then capture the value up to the next unescaped tab or end of line.
        // This is a simplified regex. Real-world LEEF parsing might need more robust regex or a multi-stage approach.
        const leefFieldRegex = `\\t${escapeRegExp(field)}=(${pattern})`; // Pattern is already escaped for regex, no need for escapeXml here.

        // Use sanitizedLogSource-child for the child decoder name
        xml += `<decoder name="${sanitizedLogSource}-child">\n`;
        xml += `  <parent>${sanitizedLogSource}</parent>\n`;
        xml += `  <regex type="pcre2">.*?${leefFieldRegex}</regex>\n`; // Use the LEEF-specific field regex
        xml += `  <order>${escapeXml(custom)}</order>\n`;
        xml += `</decoder>\n\n`;
    });

    if (typeof typeOutDecoder === 'function') {
        typeOutDecoder(xml.trim());
    } else {
        console.log(xml.trim());
    }
}

// Helper to escape regex special characters (duplicated for self-containment)
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper to escape XML special characters (duplicated for self-containment)
function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
        }
        return '';
    });
}
