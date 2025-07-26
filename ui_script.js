// Toggle Theme
const toggleButton = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");

toggleButton.addEventListener("change", function() {
  const html = document.documentElement;
  const theme = html.getAttribute("data-theme");
  const newTheme = theme === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", newTheme);
  themeLabel.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
});

// Type-out effect for output with custom line numbering
function typeOutDecoder(content) {
  const lineNumbersDiv = document.getElementById("lineNumbers");
  const outputCodeElement = document.getElementById("output");

  if (!lineNumbersDiv || !outputCodeElement) {
      console.error("Output elements not found!");
      return;
  }

  // Clear previous content
  lineNumbersDiv.innerHTML = '';
  outputCodeElement.textContent = '';

  const lines = content.split('\n');
  let currentLineIndex = 0;
  let currentCharIndex = 0;
  const speed = 5; // Typing speed in milliseconds per character

  function addLineNumber(lineNumber) {
    const lineNumberSpan = document.createElement('span');
    lineNumberSpan.textContent = lineNumber;
    lineNumbersDiv.appendChild(lineNumberSpan);
  }

  function type() {
    if (currentLineIndex < lines.length) {
      const currentLine = lines[currentLineIndex];

      if (currentCharIndex < currentLine.length) {
        outputCodeElement.textContent += currentLine.charAt(currentCharIndex);
        // Scroll the output box to keep the typing visible
        outputCodeElement.parentElement.scrollTop = outputCodeElement.parentElement.scrollHeight;
        currentCharIndex++;
        setTimeout(type, speed);
      } else {
        // End of current line
        outputCodeElement.textContent += '\n'; // Add newline for the actual code content
        outputCodeElement.parentElement.scrollTop = outputCodeElement.parentElement.scrollHeight;

        currentLineIndex++;
        currentCharIndex = 0;

        // Add line number for the next line, if it exists
        if (currentLineIndex < lines.length) { // Only add line number if there's a next line
            addLineNumber(currentLineIndex + 1); // Line numbers start from 1
        }
        setTimeout(type, speed);
      }
    } else {
        // Ensure it's scrolled to the very bottom once typing is completely finished
        outputCodeElement.parentElement.scrollTop = outputCodeElement.parentElement.scrollHeight;
    }
  }
  // Initialize first line number
  if (lines.length > 0) { // Only add line number if there's content
    addLineNumber(1);
  }
  type();
}


function copyOutput() {
  const output = document.getElementById("output");
  if (!output) {
      console.error("Output element not found for copying!");
      return;
  }
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = output.textContent; // Use textContent for code element
  document.body.appendChild(tempTextArea);
  tempTextArea.select(); // Select the content
  document.execCommand("copy");
  document.body.removeChild(tempTextArea);

  const copySuccessMessage = document.getElementById("copySuccessMessage");
  if (copySuccessMessage) {
    copySuccessMessage.style.display = "block"; // Make sure it's block for transition
    requestAnimationFrame(() => { // Trigger reflow for transition
        copySuccessMessage.classList.add("show");
    });

    setTimeout(() => {
      copySuccessMessage.classList.remove("show");
      setTimeout(() => { // Hide completely after fade out
          copySuccessMessage.style.display = "none";
      }, 300); // Match CSS transition duration
    }, 2000); // Hide after 2 seconds
  }
}

function downloadXML() {
  const content = document.getElementById("output").textContent; // Use textContent
  const logSourceInput = document.getElementById("logSource");
  if (!logSourceInput) {
      console.error("Log Source input not found for download!");
      return;
  }
  const logSource = logSourceInput.value.trim();

  // Get current date and time for filename
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  // Format: trendmicro_21-Jul-2025_14h-45m-59s.xml
  const formattedDate = `${day}-${now.toLocaleString('default', { month: 'short' })}-${year}`;
  const formattedTime = `${hours}h-${minutes}m-${seconds}s`;
  const fileName = `${logSource || "wazuh_decoder"}_${formattedDate}_${formattedTime}.xml`;

  const blob = new Blob([content], { type: "text/xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a); // Append to body required for Firefox
  a.click();
  document.body.removeChild(a); // Clean up
  URL.revokeObjectURL(a.href); // Clean up the URL object
}

// Function to fill sample data
function fillSampleData() {
  const logSourceInput = document.getElementById("logSource");
  const logsTextarea = document.getElementById("logs");
  const logTypeSelect = document.getElementById("logType"); // Get log type dropdown

  if (logSourceInput) logSourceInput.value = "Trendmicro-test";
  
  // Provide sample data based on selected log type
  if (logTypeSelect.value === "CEF") {
    if (logsTextarea) logsTextarea.value = `Jun 06 2025 12:00:55 qahy4m.manage.trendmicro.com CEF:0|Trend Micro|Apex Central|2019|700106|Data Loss Prevention|3|devicePayloadId=4860BD457222-BB2611EF-FBE7-2501-8BCF externalId=11504 cs3Label=Product_Entity/Endpoint cs3=RCHCDRPPD054 dvchost=Apex One as a Service cs1Label=Policy_GUID cs1=fe4c905e-c7ff-4c2e-86ef-10096cd23f44 cs2Label=Policy cs2=DLP cn1Label=Product cn1=15 rt=Mar 08 2025 06:28:51 GMT+00:00 src=192.168.4.155 TMCMLogDetectedIP=192.168.4.155 smac=2C-F0-5D-51-A9-52 shost=RCHCORPD054 TMCMLogDetectedHost=RCHCORPD054 cs4Label=Incident_Source_(AD_Account) cs4=testuser.t suser=test user duser=/o\\=exchangelabs/ou\\=exchange administrative group (fydibohf23spdlt)/cn\\=recipients/cn\\=17c4d8f2f49e4455910efb8976c62644-location.; msg=Book3 (003).xlsx filePath=Book3 (003).xlsx fname=Book3 (003).xlsx cs5Label=Rule cs5=Email Client cs6Label=Template cs6=All: SWIFT BIC (SWIFT Business Identifier Code) cn3Label=Channel cn3=122 cn2Label=Action cn2=3 fsize=12980 cfp1Label=ForensicFileAvailable cfp1=0 deviceFacility=Apex One ApexCentralHost=Apex Central as a Service TMCMdevicePlatform=Windows Server 2016 10.0 (Build 14393) deviceNtDomain=N/A dntdom=Corporate\\\\Usb blocked\\\\ `;
  } else if (logTypeSelect.value === "LEEF") {
    if (logsTextarea) logsTextarea.value = `LEEF:2.0|IBM|Security QRadar|7.3|LoginEvent|devTime=Jul 23 2025 10:30:00 UTC\tdevTimeFormat=MMM dd yyyy HH:mm:ss z\tproto=TCP\tsrc=192.168.1.100\tdst=10.0.0.50\tspt=54321\tdpt=8080\tusrName=johndoe\tmsg=User login successful\tsev=5\tcat=Authentication\tident=12345\tapp=WebApp\tfilePath=/home/johndoe/document.txt\tfileName=document.txt\tdeviceAction=allow\tdeviceCustomString1=ExtraInfo\tdeviceCustomNumber1=123`;
  }
}

// Function to show/hide loading spinner
function showLoadingSpinner(show) {
    const spinner = document.getElementById("loadingSpinner");
    const overlay = document.getElementById("loadingOverlay");
    if (spinner && overlay) {
        if (show) {
            spinner.style.display = "block";
            overlay.style.display = "block";
            // Trigger opacity transition after display is set to block
            requestAnimationFrame(() => {
                overlay.style.opacity = 1;
            });
        } else {
            overlay.style.opacity = 0;
            // Hide after transition
            setTimeout(() => {
                spinner.style.display = "none";
                overlay.style.display = "none";
            }, 300); // Match CSS transition duration
        }
    }
}

// Function to display error messages (moved here to be shared)
function displayErrorMessage(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add("show");
    }
}

// Function to hide error messages (moved here to be shared)
function hideErrorMessage(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove("show");
        setTimeout(() => {
            errorElement.textContent = "";
        }, 300); // Clear content after transition
    }
}


// Set initial theme label on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  const html = document.documentElement;
  const theme = html.getAttribute("data-theme");
  themeLabel.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);

  const logTypeSelect = document.getElementById("logType");
  const logSourceInput = document.getElementById("logSource"); // Get log source input
  const selectAllCheckbox = document.getElementById("selectAllCheckbox"); // Get the new checkbox

  // Event listener for Log Type dropdown change
  if (logTypeSelect) {
    logTypeSelect.addEventListener("change", () => {
      // Clear logs and fields when log type changes to avoid confusion
      document.getElementById("logs").value = "";
      document.getElementById("fieldList").innerHTML = "";
      document.getElementById("selectedList").innerHTML = "";
      // Clear both CEF and LEEF custom/global maps
      if (typeof cefCustomFieldMap !== 'undefined') Object.keys(cefCustomFieldMap).forEach(key => delete cefCustomFieldMap[key]);
      if (typeof cefGlobalFieldMap !== 'undefined') cefGlobalFieldMap.clear();
      if (typeof leefCustomFieldMap !== 'undefined') Object.keys(leefCustomFieldMap).forEach(key => delete leefCustomFieldMap[key]);
      if (typeof leefGlobalFieldMap !== 'undefined') leefGlobalFieldMap.clear();

      hideErrorMessage("logsError");
      hideErrorMessage("selectedFieldsError");
      hideErrorMessage("generationError");
      document.getElementById("output").textContent = ""; // Clear output
      document.getElementById("lineNumbers").innerHTML = ""; // Clear line numbers

      // Uncheck select all checkbox if log type changes
      if (selectAllCheckbox) {
          selectAllCheckbox.checked = false;
      }
    });
  }

  // Event listener for Log Source Name input to validate against spaces
  if (logSourceInput) {
    logSourceInput.addEventListener("input", () => {
      const logSourceValue = logSourceInput.value;
      if (/\s/.test(logSourceValue)) {
        displayErrorMessage("generationError", "Log Source Name cannot contain spaces.");
        logSourceInput.classList.add("input-error"); // Add a class for visual feedback
      } else {
        hideErrorMessage("generationError");
        logSourceInput.classList.remove("input-error");
      }
    });
  }

  // Event listener for the new "Select All" checkbox
  if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", () => {
          const selectedList = document.getElementById("selectedList");
          const fieldListDiv = document.getElementById("fieldList");

          if (selectAllCheckbox.checked) {
              // Select all fields
              const addButtons = fieldListDiv.querySelectorAll(".field-item button[data-key]");
              addButtons.forEach(button => {
                  // Only "click" if it's currently a '+' button (not already selected)
                  if (button.textContent === "+") {
                      button.click();
                  }
              });
          } else {
              // Deselect all fields
              // Iterate in reverse to avoid issues with element removal affecting loop
              const removeButtons = selectedList.querySelectorAll("li button");
              for (let i = removeButtons.length - 1; i >= 0; i--) {
                  removeButtons[i].click();
              }
          }
      });
  }


  // Event listeners for buttons
  const parseLogsBtn = document.getElementById("parseLogsBtn");
  if (parseLogsBtn) {
    parseLogsBtn.addEventListener("click", () => {
        hideErrorMessage("logsError"); // Clear previous error
        const logsContent = document.getElementById("logs").value.trim();
        const selectedLogType = document.getElementById("logType").value;

        if (!logsContent) {
            displayErrorMessage("logsError", "Please paste logs before parsing.");
            // Clear existing fields as there's no logs
            document.getElementById("fieldList").innerHTML = "";
            document.getElementById("selectedList").innerHTML = "";
            // Clear both CEF and LEEF custom/global maps
            if (typeof cefCustomFieldMap !== 'undefined') Object.keys(cefCustomFieldMap).forEach(key => delete cefCustomFieldMap[key]);
            if (typeof cefGlobalFieldMap !== 'undefined') cefGlobalFieldMap.clear();
            if (typeof leefCustomFieldMap !== 'undefined') Object.keys(leefCustomFieldMap).forEach(key => delete leefCustomFieldMap[key]);
            if (typeof leefGlobalFieldMap !== 'undefined') leefGlobalFieldMap.clear();

            // Uncheck select all checkbox if logs are cleared
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
            return;
        }

        // Call appropriate parsing logic based on selected log type
        if (selectedLogType === "CEF" && typeof parseCEFLogs === 'function') {
            parseCEFLogs();
        } else if (selectedLogType === "LEEF" && typeof parseLEEFLogs === 'function') {
            parseLEEFLogs();
        } else {
            console.error("No parsing function available for selected log type:", selectedLogType);
            displayErrorMessage("logsError", "Unsupported log type or parsing function not loaded.");
        }
        // After parsing, if there are extracted fields, ensure select all checkbox is unchecked
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
    });
  }

  const generateDecoderBtn = document.getElementById("generateDecoderBtn");
  if (generateDecoderBtn) {
    generateDecoderBtn.addEventListener("click", () => {
        hideErrorMessage("generationError"); // Clear previous error
        const logSource = document.getElementById("logSource").value.trim();
        const logs = document.getElementById("logs").value.trim(); // Re-read logs for validation
        const selectedLogType = document.getElementById("logType").value;

        // Validate log source name for spaces before proceeding
        if (/\s/.test(logSource)) {
            displayErrorMessage("generationError", "Log Source Name cannot contain spaces.");
            logSourceInput.classList.add("input-error");
            return;
        } else {
            logSourceInput.classList.remove("input-error");
        }


        let selectedFieldsCount = 0;
        if (selectedLogType === "CEF" && typeof cefCustomFieldMap !== 'undefined') {
            selectedFieldsCount = Object.keys(cefCustomFieldMap).length;
        } else if (selectedLogType === "LEEF" && typeof leefCustomFieldMap !== 'undefined') {
            selectedFieldsCount = Object.keys(leefCustomFieldMap).length;
        }


        if (!logSource) {
            displayErrorMessage("generationError", "Please fill in the 'Log Source Name'.");
            return;
        }
        if (!logs) { // Check logs content again before generation
            displayErrorMessage("generationError", "Please paste logs.");
            return;
            // Note: If logs are empty, parseLogs() should also clear fields, preventing generation
        }
        if (selectedFieldsCount === 0) {
            displayErrorMessage("generationError", "Please select at least one field.");
            return;
        }

        showLoadingSpinner(true);
        // Defer the generation to allow the spinner to render
        setTimeout(() => {
            if (selectedLogType === "CEF" && typeof generateCEFDecoder === 'function') {
                generateCEFDecoder();
            } else if (selectedLogType === "LEEF" && typeof generateLEEFDecoder === 'function') {
                generateLEEFDecoder();
            } else {
                console.error("No generation function available for selected log type:", selectedLogType);
                displayErrorMessage("generationError", "Unsupported log type or generation function not loaded.");
            }
            showLoadingSpinner(false); // Hide spinner after generation is complete
        }, 10); // A small delay (e.g., 10ms) to allow UI to update
    });
  }

  const copyOutputBtn = document.getElementById("copyOutputBtn");
  if (copyOutputBtn) {
    copyOutputBtn.addEventListener("click", copyOutput);
  }

  const downloadXMLBtn = document.getElementById("downloadXMLBtn");
  if (downloadXMLBtn) {
    downloadXMLBtn.addEventListener("click", downloadXML);
  }

  // Event listener for the new Sample Data button
  const sampleDataBtn = document.getElementById("sampleDataBtn");
  if (sampleDataBtn) {
    sampleDataBtn.addEventListener("click", fillSampleData);
  }
});

// MODIFIED: Added ensureFieldItemClass function
// This function ensures that the 'field-item' class is applied to the list item
// when rendering selected fields. This should be called by your renderSelectedFields
// function in cef_decoder_logic.js and leef_decoder_logic.js
function ensureFieldItemClass(listItem) {
    if (listItem && !listItem.classList.contains('field-item')) {
        listItem.classList.add('field-item');
    }
}
