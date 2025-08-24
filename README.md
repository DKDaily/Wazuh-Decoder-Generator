# Wazuh Decoder Generator for CEF & LEEF

A powerful web-based tool designed to automatically generate optimized Wazuh decoders for CEF (Common Event Format) and LEEF (Log Event Extended Format) logs.

### The Problem

As a **Security Engineer**, you know that onboarding new log sources into a SIEM like Wazuh is a critical, yet often tedious, task. Manually writing regex for decoders is time-consuming, prone to errors, and requires deep familiarity with log formats and Wazuh's XML syntax. This tool was built to eliminate that friction, saving you valuable time and effort.

---

### Key Features ✨

This isn't just a basic text-to-XML converter. It's an intelligent assistant built with the security professional in mind.

* **Intelligent Log Parsing:** Simply paste your raw logs, and the tool automatically extracts all unique fields and their sample values. It reliably handles logs with or without syslog headers.
* **Automatic Prematch Generation:** The tool intelligently infers the common header from your logs to create an accurate `<prematch>` string, ensuring your parent decoder works correctly from the start.
* **Smart Regex Inference:** For each field, the generator automatically suggests an optimized regex pattern by analyzing the field's name and sample data. It can identify common types like IP addresses, URLs, file paths, and numbers.
* **Advanced Decoder Option (Single-Child):** Generate a single, high-performance child decoder that combines all regex patterns. This is the recommended best practice for Wazuh as it reduces processing overhead compared to having multiple child decoders.
* **Field Normalization & Customization:**
    * **Suggests Common Names:** The tool suggests normalized field names (e.g., mapping `src` to `source.ip`) to align with Wazuh's standard taxonomy, making your data immediately useful for correlation and rule-building.
    * **Full Control:** You have full control to customize the final field names to match your specific needs.
* **100% Client-Side & Secure:** **Your logs never leave your browser**. All parsing and generation logic runs locally using JavaScript. This is a critical privacy feature for any security professional.
* **Sleek & User-Friendly UI:**
    * **Light & Dark Themes:** Choose a theme that suits your preference.
    * **Helpful Tooltips:** Guide you through every step of the process.
    * **Convenient Actions:** Easily load sample data, copy the generated XML, or download it as a file named after your log source.

---

### How to Use

1.  **Enter Log Source Name:** Give your log source a unique name (e.g., `trendmicro-apex`).
2.  **Select Log Type:** Choose either **CEF** or **LEEF** from the dropdown menu.
3.  **Paste Your Logs:** Add one or more sample log lines into the text area. The more logs you provide, the more accurate the field extraction will be.
4.  **Extract Fields:** Click the **"Extract Fields"** button. The application will parse the logs and populate the "Extracted Fields" list.
5.  **Select & Customize Fields:** Add fields from the "Extracted" list to the "Selected" list. Here, you can customize the final field name for normalization. Use the "Select All" checkbox for convenience.
6.  **Generate Decoder:**
    * Click **"Generate Decoder"** for the recommended, high-performance single-child decoder.
    * Or, use the dropdown to select the "Basic (Multi-Child)" option if needed.
7.  **Copy or Download:** Use the buttons to copy the generated XML to your clipboard or download it as a `.xml` file.

---

### Supported Log Formats

* **CEF (Common Event Format)**
* **LEEF (Log Event Extended Format)**
