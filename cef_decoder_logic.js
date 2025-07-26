// Global map to store custom field names (used for "Selected Fields" inputs)
const cefCustomFieldMap = {}; // Renamed for clarity
// Global map to store all extracted fields and their sample values (from raw logs)
let cefGlobalFieldMap = new Map(); // Renamed for clarity

// commonCefFields is now loaded from common_fields.js via the window object
// const commonCefFields = [ ... ]; // REMOVED FROM HERE

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
 * Parses CEF logs, extracts fields, and populates the UI.
 * This function is designed to be called when CEF is selected.
 */
function parseCEFLogs() { // Renamed from parseLogs
  const logs = document.getElementById("logs").value.trim();
  const lines = logs.split(/\n|\r/).filter(Boolean); // Filter out empty lines

  // Clear existing UI elements and reset maps regardless of log content
  document.getElementById("fieldList").innerHTML = "";
  document.getElementById("selectedList").innerHTML = "";
  Object.keys(cefCustomFieldMap).forEach(key => delete cefCustomFieldMap[key]); // Clear customFieldMap
  cefGlobalFieldMap.clear();
  hideErrorMessage("selectedFieldsError"); // Clear any previous error message

  if (lines.length === 0) {
      document.getElementById("fieldList").innerHTML = "<p class='text-center mt-4'>No CEF logs detected. Please paste logs.</p>";
      return; // Exit if no valid lines
  }

  lines.forEach(line => {
    // Find the CEF part
    const cefStart = line.indexOf("CEF:");
    if (cefStart === -1) return; // Skip lines that don't look like CEF

    // Get everything after "CEF:"
    const cef = line.substring(cefStart + 4);

    // Find the position of the last pipe
    const lastPipeIndex = cef.lastIndexOf("|");
    // If no pipes after CEF:, or if it's just "CEF:|" without extension, skip
    if (lastPipeIndex === -1 || lastPipeIndex === cef.length -1) return;

    // Extract only the extension part after the last pipe
    const extension = cef.substring(lastPipeIndex + 1);

    // Split key-value pairs (handle escaped spaces)
    // This regex splits on spaces, but only if the space is followed by a word character, dot, or hyphen and then an equals sign
    const pairs = extension.split(/ (?=[\w.-]+=)/g);

    pairs.forEach(p => {
      const [key, ...valParts] = p.split("=");
      // Ensure key exists and value parts exist before processing
      if (!key || !valParts.length) return;

      const val = valParts.join("=").trim(); // Join parts back in case value itself contained '='
      const k = key.trim();

      if (k) { // Ensure key is not empty after trimming
          if (!cefGlobalFieldMap.has(k)) cefGlobalFieldMap.set(k, new Set());
          cefGlobalFieldMap.get(k).add(val);
      }
    });
  });

  // Sort keys alphabetically
  const sortedKeys = [...cefGlobalFieldMap.keys()].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  if (sortedKeys.length === 0) {
      document.getElementById("fieldList").innerHTML = "<p class='text-center mt-4'>No CEF fields extracted. Check log format or provide more detailed logs.</p>";
      return;
  }

  // Render extracted fields
  const fieldListDiv = document.getElementById("fieldList");
  sortedKeys.forEach(key => {
    const values = cefGlobalFieldMap.get(key);
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
    if (cefCustomFieldMap.hasOwnProperty(key)) {
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
		li.classList.add("field-item"); 
    //  li.className = "p-1 mb-8 border-b border-gray-600 flex items-center justify-between flex-wrap"; // Changed mb-1 to mb-8
        li.dataset.key = key;

        const originalNameSpan = document.createElement("span");
        originalNameSpan.innerHTML = key + ":&nbsp;&nbsp;"; // Added colon and non-breaking spaces
        originalNameSpan.className = "mr-4 min-w-[80px] font-bold"; // Changed mr-2 to mr-4

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
        const previousCustomName = cefCustomFieldMap[key];
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
        const isDuplicateCustomName = Object.keys(cefCustomFieldMap).some(
            (originalFieldKey) => cefCustomFieldMap[originalFieldKey] === initialSelectedName && originalFieldKey !== key
        );

        if (isDuplicateCustomName) {
            displayErrorMessage("selectedFieldsError", `The field name "${initialSelectedName}" is already in use by another selected field. Please choose a different name.`);
            return; // Prevent adding the duplicate
        }

        cefCustomFieldMap[key] = initialSelectedName; // Now initialize the map entry here

        // Event listener for dropdown change
        commonFieldSelect.onchange = (event) => {
            const selectedValue = event.target.value;
            // Validate on change to prevent immediate duplication
            const isDuplicate = Object.keys(cefCustomFieldMap).some(
                (originalFieldKey) => cefCustomFieldMap[originalFieldKey] === selectedValue && originalFieldKey !== key
            );

            if (isDuplicate) {
                displayErrorMessage("selectedFieldsError", `The field name "${selectedValue}" is already in use by another selected field. Please choose a different name.`);
                // Revert to the previous valid value
                event.target.value = cefCustomFieldMap[key]; // Revert to the last valid selection
                return;
            }

            hideErrorMessage("selectedFieldsError"); // Clear error if selection is valid
            cefCustomFieldMap[key] = selectedValue; // Update customFieldMap directly
            customNameInput.value = selectedValue; // Keep input value in sync (hidden)
        };

        // Event listener for custom input change/blur
        customNameInput.oninput = (event) => {
             // Only update customFieldMap if the input is currently visible and being used
            if (customNameInput.style.display !== "none") {
                 cefCustomFieldMap[key] = event.target.value.trim();
                 hideErrorMessage("selectedFieldsError"); // Clear error on input change (user is typing)
            }
        };

        // Add an "edit" icon (e.g., a pencil)
        const editIcon = document.createElement("span");
        editIcon.className = "edit-icon mr-2";
        editIcon.innerHTML = "&#x1F58A;"; // Pen symbol 🖊
        editIcon.title = "Edit custom field name";
        editIcon.style.cursor = "pointer"; // Ensure it looks clickable

        editIcon.onclick = () => {
            // Toggle visibility of input and dropdown
            if (customNameInput.style.display === "none") {
                commonFieldSelect.style.display = "none";
                customNameInput.style.display = "block";
                // Set input value to current mapped value (from dropdown or previous custom)
                customNameInput.value = cefCustomFieldMap[key] || key;
                customNameInput.focus(); // Focus the input when it appears
                hideErrorMessage("selectedFieldsError"); // Clear error when opening edit mode
            } else {
                // If input is currently shown, commit its value and switch back to dropdown
                const trimmedValue = customNameInput.value.trim();

                // Validate before committing
                const isDuplicate = Object.keys(cefCustomFieldMap).some(
                    (originalFieldKey) => cefCustomFieldMap[originalFieldKey] === trimmedValue && originalFieldKey !== key
                );

                if (isDuplicate) {
                    displayErrorMessage("selectedFieldsError", `The field name "${trimmedValue}" is already in use by another selected field. Please choose a different name.`);
                    customNameInput.focus(); // Keep focus on input for correction
                    return; // Do not commit the duplicate
                }

                hideErrorMessage("selectedFieldsError"); // Clear error if commitment is valid
                cefCustomFieldMap[key] = trimmedValue;

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
          delete cefCustomFieldMap[key]; // Remove from customFieldMap
          hideErrorMessage("selectedFieldsError"); // Clear error when removing a field
          // Reset button to "+" in the extracted fields list
          addBtn.textContent = "+";
          addBtn.classList.remove("btn-remove");
          addBtn.classList.add("btn-primary"); // Ensure it's not a remove button visually
          // addBtn.classList.add("btn-remove"); // If you want it red when selected again

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
          delete cefCustomFieldMap[key];
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

// Function to infer regex based on field content
function inferRegexForCEFField(field, sampleValues) { // Renamed from inferRegexForField
  const lower = field.toLowerCase();
  // Get a sample value, prefer a non-empty one if available
  const val = [...sampleValues].find(v => v !== "") || "";

  if (lower.includes("url") || val.match(/^https?:\/\//)) {
    return `(https?:\/\/[^\\s]+)`;
  } else if (lower.includes("path") || val.match(/[A-Z]:\\|\/|[\/\\\\]/) || field === "sproc") {
    return `([\\w\\\\:\\/\\.\\-\\s\\(\\)]+)`;
  } else if (lower.includes("ip") || val.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
    return `((?:\\d{1,3}\\.){3}\\d{1,3})`;
  } else if (lower.includes("email") || val.includes("@")) {
    return `([\\w.-]+@[\\w.-]+(?:\\.[\\w.-]+)+)`;
  } else if (val.match(/^\d+$/)) {
    return `(\\d+)`;
  } else if (field === "TMCMLogTarget") {
    return `([\\w.]+)`;
  } else {
    // Default regex for general alphanumeric and common symbols, but not capturing spaces within value unless specified
    return `([^\\s]+)`;
  }
}

/**
 * Generates the Wazuh decoder XML for CEF logs.
 */
function generateCEFDecoder() { // Renamed from generateDecoder
  const logSource = document.getElementById("logSource").value.trim();
  const logs = document.getElementById("logs").value.trim();
  const selectedFields = Object.keys(cefCustomFieldMap);

  // Sanitize log source name for decoder XML. Remove spaces and special characters.
  const sanitizedLogSource = logSource.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  let prematch = "CEF:";
  const firstLogLine = logs.split(/\n|\r/).filter(Boolean)[0];
  if (firstLogLine) {
    const cefIndex = firstLogLine.indexOf("CEF:");
    if (cefIndex !== -1) {
      const partBeforeCef = firstLogLine.substring(0, cefIndex).trim();
      const parts = partBeforeCef.split(/\s+/);
      if (parts.length > 0) {
        const identifier = parts[parts.length - 1];
        prematch = identifier + " CEF:";
      }
    }
  }

  // Use sanitizedLogSource directly for the parent decoder name
  let xml = `<decoder name="${sanitizedLogSource}">\n`;
  xml += `  <prematch>${escapeXml(prematch)}</prematch>\n`;
  xml += `</decoder>\n\n`;

  selectedFields.forEach(field => {
    const custom = cefCustomFieldMap[field] || field;
    const values = cefGlobalFieldMap.get(field) || new Set();
    let pattern = inferRegexForCEFField(field, values); // Using renamed function

    // Use sanitizedLogSource-child for the child decoder name
    xml += `<decoder name="${sanitizedLogSource}-child">\n`;
    xml += `  <parent>${sanitizedLogSource}</parent>\n`;
    xml += `  <regex type="pcre2">.*?${escapeXml(field)}=${escapeXml(pattern)}</regex>\n`;
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
