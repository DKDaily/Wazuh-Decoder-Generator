// ui_script.js

document.addEventListener('DOMContentLoaded', function() {
    // --- STATE MANAGEMENT ---
    let globalFieldMap = new Map(); // Holds all fields extracted from the current logs.
    let customFieldMap = new Map(); // Holds the user's selected fields and their custom names.
    let typingEffectEnabled = true; // New state for typing effect

    // --- ELEMENT REFERENCES ---
    const elements = {
        themeToggle: document.getElementById("themeToggle"),
        themeLabel: document.getElementById("themeLabel"),
        logSourceInput: document.getElementById("logSource"),
        logTypeSelect: document.getElementById("logType"),
        logsTextarea: document.getElementById("logs"),
        parseLogsBtn: document.getElementById("parseLogsBtn"),
        generateDecoderBtn: document.getElementById("generateDecoderBtn"),
        copyOutputBtn: document.getElementById("copyOutputBtn"),
        downloadXMLBtn: document.getElementById("downloadXMLBtn"),
        sampleDataBtn: document.getElementById("sampleDataBtn"),
        selectAllCheckbox: document.getElementById("selectAllCheckbox"),
        fieldListDiv: document.getElementById("fieldList"),
        selectedListDiv: document.getElementById("selectedList"),
        outputContainer: document.getElementById("outputContainer"),
        outputCode: document.getElementById("output"),
        lineNumbersDiv: document.getElementById("lineNumbers"),
        loadingOverlay: document.getElementById("loadingOverlay"),
        copySuccessMessage: document.getElementById("copySuccessMessage"),
        logsError: document.getElementById("logsError"),
        selectedFieldsError: document.getElementById("selectedFieldsError"),
        generationError: document.getElementById("generationError"),
        disableTypingEffectToggle: document.getElementById("disableTypingEffectToggle"),
        sectionSpinner: document.getElementById("sectionSpinner"),
        // Added reference to the parent container of the output box for scrolling
        outputSectionContainer: document.querySelector('.fields-container-box.mt-6:last-of-type'), // This targets the last .fields-container-box which is your output section
        // New reference for the Extracted/Selected Fields section
        fieldSelectionContainer: document.querySelector('.fields-container-box.mt-4')
    };

    // --- UI HELPER FUNCTIONS ---

    const showLoadingSpinner = (show) => {
        if (show) {
            elements.sectionSpinner.style.display = "block";
            elements.loadingOverlay.style.display = "block";
            requestAnimationFrame(() => elements.loadingOverlay.style.opacity = 1);
        } else {
            elements.loadingOverlay.style.opacity = 0;
            setTimeout(() => {
                elements.sectionSpinner.style.display = "none";
                elements.loadingOverlay.style.display = "none";
            }, 300);
        }
    };

    const displayErrorMessage = (element, message) => {
        if(element) {
            element.textContent = message;
            element.classList.add("show");
        }
    };

    const hideErrorMessage = (element) => {
        if(element && element.classList.contains("show")) {
            element.classList.remove("show");
            setTimeout(() => element.textContent = "", 300);
        }
    };

    const typeOutDecoder = (content) => {
        elements.lineNumbersDiv.innerHTML = '';
        elements.outputCode.textContent = '';
        // Removed scroll into view from here as it's now handled before spinner

        if (!typingEffectEnabled) {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                elements.outputCode.textContent += line + '\n';
                elements.lineNumbersDiv.innerHTML += `<span>${index + 1}</span>`;
            });
            elements.outputContainer.scrollTop = elements.outputContainer.scrollHeight;
            return;
        }

        const lines = content.split('\n');
        let lineIndex = 0, charIndex = 0;
        const speed = 5;

        const type = () => {
            if (lineIndex < lines.length) {
                const currentLine = lines[lineIndex];
                if (charIndex < currentLine.length) {
                    elements.outputCode.textContent += currentLine.charAt(charIndex++);
                    elements.outputContainer.scrollTop = elements.outputContainer.scrollHeight;
                    setTimeout(type, speed);
                } else {
                    elements.outputCode.textContent += '\n';
                    elements.outputContainer.scrollTop = elements.outputContainer.scrollHeight;
                    lineIndex++;
                    charIndex = 0;
                    if(lineIndex < lines.length) elements.lineNumbersDiv.innerHTML += `<span>${lineIndex + 1}</span>`;
                    setTimeout(type, speed);
                }
            } else {
                 elements.outputContainer.scrollTop = elements.outputContainer.scrollHeight;
            }
        };
        if (lines.length > 0) elements.lineNumbersDiv.innerHTML = `<span>1</span>`;
        type();
    };

    // --- RENDER FUNCTIONS ---

    const renderExtractedFields = () => {
        elements.fieldListDiv.innerHTML = "";
        const sortedKeys = [...globalFieldMap.keys()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        
        if (sortedKeys.length === 0) {
            elements.fieldListDiv.innerHTML = "<p class='text-center mt-4'>No fields extracted. Check log format.</p>";
            return;
        }

        sortedKeys.forEach(key => {
            const values = globalFieldMap.get(key);
            const wrapper = document.createElement("div");
            wrapper.className = "field-item";

            const label = document.createElement("span");
            label.textContent = key;
            label.className = "min-w-[140px]";

            const valueSelect = document.createElement("select");
            valueSelect.className = "input-box flex-grow mr-2";
            values.forEach(val => valueSelect.add(new Option(val, val)));
            
            const addBtn = document.createElement("button");
            addBtn.dataset.key = key;
            if(customFieldMap.has(key)) {
                addBtn.textContent = "-";
                addBtn.className = "btn-remove ml-2";
            } else {
                addBtn.textContent = "+";
                addBtn.className = "btn-primary ml-2";
            }
            
            addBtn.onclick = () => handleFieldSelectionToggle(key);

            wrapper.append(label, valueSelect, addBtn);
            elements.fieldListDiv.appendChild(wrapper);
        });
    };

    const renderSelectedFields = () => {
        elements.selectedListDiv.innerHTML = "";
        customFieldMap.forEach((customName, originalName) => {
            const li = createSelectedFieldItem(originalName, customName);
            elements.selectedListDiv.appendChild(li);
        });
        updateSelectAllCheckboxState();
    };
    
    const createSelectedFieldItem = (originalName, customName) => {
        const li = document.createElement("li");
        li.className = "field-item";
        li.dataset.key = originalName;

        const nameSpan = document.createElement("span");
        nameSpan.innerHTML = `${originalName}:&nbsp;&nbsp;`;
        nameSpan.className = "mr-4 min-w-[80px] font-bold";

        const commonFieldSelect = document.createElement("select");
        commonFieldSelect.className = "input-box flex-grow mr-2 max-w-[250px]";
        
        // Populate dropdown with common fields
        const uniqueNormalizedFields = new Set(window.commonNormalizedFields.slice(1).map(f => f.normalized));
        commonFieldSelect.add(new Option(originalName, originalName));
        uniqueNormalizedFields.forEach(field => commonFieldSelect.add(new Option(field, field)));
        
        const customNameInput = document.createElement("input");
        customNameInput.type = "text";
        customNameInput.className = "input-box flex-grow mr-2 max-w-[250px]";
        customNameInput.placeholder = "Enter custom field name";
        customNameInput.style.display = "none";

        // Set initial value
        if ([...commonFieldSelect.options].some(opt => opt.value === customName)) {
            commonFieldSelect.value = customName;
        } else {
            const customOption = new Option(customName, customName, true, true);
            commonFieldSelect.appendChild(customOption);
            commonFieldSelect.value = customName;
        }
        
        const editIcon = document.createElement("span");
        editIcon.className = "edit-icon mr-2";
        editIcon.innerHTML = "&#x1F58A;"; // Pen symbol
        editIcon.title = "Edit custom field name";
        editIcon.style.cursor = "pointer";
        
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "x";
        removeBtn.className = "ml-2 btn-primary p-1 btn-remove";
        removeBtn.onclick = () => handleFieldSelectionToggle(originalName);

        // Event handling for editing
        const commitChange = () => {
            const newValue = customNameInput.value.trim() || originalName;
            if (isFieldNameDuplicate(newValue, originalName)) {
                 displayErrorMessage(elements.selectedFieldsError, `Field name "${newValue}" is already in use.`);
                 return false;
            }
            hideErrorMessage(elements.selectedFieldsError);
            customFieldMap.set(originalName, newValue);
            if (![...commonFieldSelect.options].some(o => o.value === newValue)) {
                commonFieldSelect.add(new Option(newValue, newValue, true, true));
            }
            commonFieldSelect.value = newValue;
            customNameInput.style.display = "none";
            commonFieldSelect.style.display = "block";
            return true;
        };

        editIcon.onclick = () => {
            if (customNameInput.style.display === "none") {
                customNameInput.value = customFieldMap.get(originalName) || "";
                commonFieldSelect.style.display = "none";
                customNameInput.style.display = "block";
                customNameInput.focus();
            } else {
                commitChange();
            }
        };

        customNameInput.onkeydown = (e) => { if (e.key === 'Enter') commitChange(); };
        customNameInput.onblur = () => { if (customNameInput.style.display !== 'none') commitChange(); };

        commonFieldSelect.onchange = (e) => {
            const newValue = e.target.value;
             if (isFieldNameDuplicate(newValue, originalName)) {
                 displayErrorMessage(elements.selectedFieldsError, `Field name "${newValue}" is already in use.`);
                 e.target.value = customFieldMap.get(originalName); // Revert
                 return;
            }
            hideErrorMessage(elements.selectedFieldsError);
            customFieldMap.set(originalName, newValue);
        };

        li.append(nameSpan, commonFieldSelect, customNameInput, editIcon, removeBtn);
        return li;
    };
    
    // --- EVENT HANDLERS & LOGIC ---
    
    const resetState = () => {
        globalFieldMap.clear();
        customFieldMap.clear();
        elements.logsTextarea.value = "";
        elements.fieldListDiv.innerHTML = "";
        elements.selectedListDiv.innerHTML = "";
        elements.outputCode.textContent = "";
        elements.lineNumbersDiv.innerHTML = "";
        elements.selectAllCheckbox.checked = false;
        hideErrorMessage(elements.logsError);
        hideErrorMessage(elements.selectedFieldsError);
        hideErrorMessage(elements.generationError);
        elements.sampleDataBtn.style.display = "inline-flex";
    };

    const isFieldNameDuplicate = (name, selfKey) => {
        for (const [key, value] of customFieldMap.entries()) {
            if (key !== selfKey && value === name) return true;
        }
        return false;
    };

    const updateSelectAllCheckboxState = () => {
        const allSelected = globalFieldMap.size > 0 && globalFieldMap.size === customFieldMap.size;
        elements.selectAllCheckbox.checked = allSelected;
    };

    const handleFieldSelectionToggle = (key) => {
        hideErrorMessage(elements.selectedFieldsError);
        if (customFieldMap.has(key)) {
            customFieldMap.delete(key);
        } else {
            const matchingCommonField = window.commonNormalizedFields.find(f => f.original === key);
            const initialName = matchingCommonField ? matchingCommonField.normalized : key;
            if(isFieldNameDuplicate(initialName, key)) {
                displayErrorMessage(elements.selectedFieldsError, `Default name "${initialName}" conflicts with an existing selection. Please select and rename manually.`);
                return;
            }
            customFieldMap.set(key, initialName);
        }
        renderExtractedFields();
        renderSelectedFields();
    };

    elements.themeToggle.onchange = () => {
        const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        elements.themeLabel.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
    };
    
    elements.logTypeSelect.onchange = resetState;
    
    elements.sampleDataBtn.onclick = () => {
        const logType = elements.logTypeSelect.value;
        elements.logSourceInput.value = logType === "CEF" ? "Trendmicro-test" : "QRadar-test";
        if (window.sampleLogs[logType] && Array.isArray(window.sampleLogs[logType])) {
            elements.logsTextarea.value = window.sampleLogs[logType].join('\n');
        } else {
            elements.logsTextarea.value = "";
        }
        elements.sampleDataBtn.style.display = "none";
    };

    elements.parseLogsBtn.onclick = () => {
        const logs = elements.logsTextarea.value.trim();
        const logType = elements.logTypeSelect.value;
        hideErrorMessage(elements.logsError);

        if (!logs) {
            displayErrorMessage(elements.logsError, "Please paste logs before parsing.");
            resetState();
            elements.logsTextarea.value = "";
            return;
        }
        
        globalFieldMap.clear();
        customFieldMap.clear();
        
        // No spinner for "Extract Fields" button as per user request
        // showLoadingSpinner(true); 

        // Delay parsing and rendering for smoother scroll, even without spinner
        setTimeout(() => {
            globalFieldMap = logType === 'CEF' ? extractCEFFields(logs) : extractLEEFFields(logs);
            
            renderExtractedFields();
            renderSelectedFields();
            elements.selectAllCheckbox.checked = false;
            elements.sampleDataBtn.style.display = "inline-flex";
            // No spinner for "Extract Fields" button as per user request
            // showLoadingSpinner(false); 

            // Scroll to the "Extracted Fields" and "Selected Fields" module
            elements.fieldSelectionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500); // Small delay for a smoother scroll
    };

    elements.selectAllCheckbox.onchange = () => {
        if (elements.selectAllCheckbox.checked) {
            let hasConflict = false;
            const tempMap = new Map();
            for (const key of globalFieldMap.keys()) {
                 const matchingCommonField = window.commonNormalizedFields.find(f => f.original === key);
                 const initialName = matchingCommonField ? matchingCommonField.normalized : key;
                 if ([...tempMap.values()].includes(initialName)) {
                     hasConflict = true;
                     break;
                 }
                 tempMap.set(key, initialName);
            }

            if (hasConflict) {
                displayErrorMessage(elements.selectedFieldsError, "Cannot select all due to duplicate default field names. Please select fields individually.");
                elements.selectAllCheckbox.checked = false;
                return;
            }
            customFieldMap = tempMap;

        } else {
            customFieldMap.clear();
        }
        renderExtractedFields();
        renderSelectedFields();
    };

    elements.disableTypingEffectToggle.onchange = () => {
        typingEffectEnabled = !elements.disableTypingEffectToggle.checked;
        if (!typingEffectEnabled && elements.outputCode.textContent) {
            const currentContent = elements.outputCode.textContent;
            elements.outputCode.textContent = '';
            elements.lineNumbersDiv.innerHTML = '';
            typeOutDecoder(currentContent);
        }
    };

    elements.generateDecoderBtn.onclick = () => {
        hideErrorMessage(elements.generationError);
        const logSource = elements.logSourceInput.value.trim();
        const logType = elements.logTypeSelect.value;

        if (!logSource) return displayErrorMessage(elements.generationError, "Log Source Name is required.");
        if (/\s/.test(logSource)) return displayErrorMessage(elements.generationError, "Log Source Name cannot contain spaces.");
        if (elements.logsTextarea.value.trim() === "") return displayErrorMessage(elements.generationError, "Logs are required.");
        if (customFieldMap.size === 0) return displayErrorMessage(elements.generationError, "Please select at least one field.");

        showLoadingSpinner(true); // Show spinner in the "Extracted/Selected Fields" area
        
        // This setTimeout ensures the spinner is displayed for 2 seconds FIRST.
        // The scrolling and decoder generation happen AFTER this delay.
        setTimeout(() => {
            // Scroll to the "Extracted Fields" and "Selected Fields" module to show the Generate Decoder button and modules above it
            elements.fieldSelectionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const generator = logType === 'CEF' ? generateCEFDecoder : generateLEEFDecoder;
            const xmlOutput = generator(logSource, elements.logsTextarea.value, customFieldMap, globalFieldMap);
            typeOutDecoder(xmlOutput);
            showLoadingSpinner(false); // Hide spinner after content starts appearing
        }, 2000); // 2-second delay
    };

    elements.copyOutputBtn.onclick = () => {
        navigator.clipboard.writeText(elements.outputCode.textContent).then(() => {
            // Show success message
            elements.copySuccessMessage.style.display = 'block'; // Ensure display is block
            elements.copySuccessMessage.classList.add("show");
            setTimeout(() => {
                elements.copySuccessMessage.classList.remove("show");
                elements.copySuccessMessage.style.display = 'none'; // Hide after transition
            }, 2000);

            // Select the text in the output code block
            const range = document.createRange();
            range.selectNodeContents(elements.outputCode);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Optionally, you can add an error message here if copy fails
        });
    };
    
    elements.downloadXMLBtn.onclick = () => {
        const content = elements.outputCode.textContent;
        const logSource = elements.logSourceInput.value.trim() || "wazuh-decoder";
        const now = new Date();
        const timestamp = `${now.getDate().toString().padStart(2, '0')}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}h-${now.getMinutes().toString().padStart(2, '0')}m-${now.getSeconds().toString().padStart(2, '0')}s`;
        const fileName = `${logSource}_${timestamp}.xml`;
        
        const blob = new Blob([content], { type: "text/xml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // --- INITIALIZATION ---
    const initialTheme = document.documentElement.getAttribute("data-theme") || "dark";
    elements.themeLabel.textContent = initialTheme.charAt(0).toUpperCase() + initialTheme.slice(1);
    elements.disableTypingEffectToggle.checked = !typingEffectEnabled;
});
