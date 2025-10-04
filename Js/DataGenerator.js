document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const fieldsDiv = document.getElementById("fields");
  const addFieldBtn = document.getElementById("addFieldBtn");
  const templateSelector = document.getElementById("templateSelector");
  const templateInput = document.getElementById("templateInput");
  const recordCountInput = document.getElementById("recordCount");
  const generateBtn = document.getElementById("generateBtn");
  const outputPre = document.getElementById("outputPre");
  const copyBtn = document.getElementById("copyBtn");

  // Create export button (initially hidden)
  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export CSV";
  exportBtn.className = "button export-btn";
  exportBtn.style.display = "none";
  exportBtn.title = "Download as CSV file";

  // Insert export button after the copy button
  copyBtn.parentNode.insertBefore(exportBtn, copyBtn.nextSibling);

  // Create modal elements
  const modalContainer = document.createElement("div");
  modalContainer.className = "modal-container";
  modalContainer.style.display = "none";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalMessage = document.createElement("p");
  modalMessage.className = "modal-message";

  const modalClose = document.createElement("button");
  modalClose.className = "modal-close";
  modalClose.textContent = "×";
  modalClose.addEventListener("click", () => {
    modalContainer.style.display = "none";
  });

  // Assemble modal
  modalContent.appendChild(modalClose);
  modalContent.appendChild(modalMessage);
  modalContainer.appendChild(modalContent);
  document.body.appendChild(modalContainer);

  // Add modal CSS
  const modalStyle = document.createElement("style");
  modalStyle.textContent = `
    .export-btn {
      background-color: #27ae60;
      margin-left: 8px;
      transition: background-color 0.3s;
    }
    .export-btn:hover {
      background-color: #2ecc71;
    }
    .modal-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background-color: white;
      padding: 30px 40px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      position: relative;
      min-width: 300px;
      text-align: center;
      animation: modalFadeIn 0.3s ease-out;
    }
    .modal-message {
      font-size: 1.2rem;
      color: #2c3e50;
      margin: 10px 0;
    }
    .modal-close {
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 1.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #7f8c8d;
    }
    .modal-close:hover {
      color: #34495e;
    }
    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(modalStyle);

  // Function to show modal with message
  function showModal(message) {
    modalMessage.textContent = message;
    modalContainer.style.display = "flex";

    // Auto-hide after 3 seconds
    setTimeout(() => {
      modalContainer.style.display = "none";
    }, 3000);
  }

  // Data storage
  let generatorData = {};
  let dataTypes = [];
  let templates = {};

  // Load data from JSON file
  fetch("../../Data/generatorData.json")
    .then((response) => response.json())
    .then((data) => {
      generatorData = data;
      dataTypes = data.dataTypes;
      templates = data.templates;

      // Initialize the template input after data is loaded
      templateInput.value = templates.json;
      templateInput.disabled = true;

      // Initialize fields after data is loaded
      renderFields();

      // Show data ready modal
      const totalDataItems =
        data.firstNames.length +
        data.lastNames.length +
        data.domains.length +
        data.areaCodes.length +
        data.streetNames.length +
        data.streetTypes.length;

      showModal(`Data ready! ${totalDataItems} data items loaded.`);
    })
    .catch((error) => {
      console.error("Error loading generator data:", error);
      showModal("Error loading data. Please check the console for details.");
    });

  // For CSV field escaping
  function escapeCSV(value) {
    if (typeof value !== "string") value = String(value);
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  function generateFakeData(type, customValue) {
    // Check if data is loaded
    if (!generatorData.firstNames) {
      return type === "custom" ? customValue || "" : "Loading data...";
    }

    // Use data from JSON file
    const firstNames = generatorData.firstNames;
    const lastNames = generatorData.lastNames;
    const domains = generatorData.domains;
    const areaCodes = generatorData.areaCodes;
    const streetNames = generatorData.streetNames;
    const streetTypes = generatorData.streetTypes;

    switch (type) {
      case "name":
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
          lastNames[Math.floor(Math.random() * lastNames.length)]
        }`;

      case "email":
        const firstName =
          firstNames[
            Math.floor(Math.random() * firstNames.length)
          ].toLowerCase();
        const lastName =
          lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase();
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const separator = Math.random() > 0.5 ? "." : "";
        return `${firstName}${separator}${lastName}${Math.floor(
          Math.random() * 100
        )}@${domain}`;

      case "phone":
        const areaCode =
          areaCodes[Math.floor(Math.random() * areaCodes.length)];
        const prefix = Math.floor(Math.random() * 900) + 100;
        const lineNum = Math.floor(Math.random() * 9000) + 1000;
        return `(${areaCode}) ${prefix}-${lineNum}`;

      case "address":
        const streetNum = Math.floor(Math.random() * 9000) + 100;
        const streetName =
          streetNames[Math.floor(Math.random() * streetNames.length)];
        const streetType =
          streetTypes[Math.floor(Math.random() * streetTypes.length)];
        return `${streetNum} ${streetName} ${streetType}`;

      case "date":
        const year = Math.floor(Math.random() * 10) + 2014;
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        return `${year}-${month.toString().padStart(2, "0")}-${day
          .toString()
          .padStart(2, "0")}`;

      case "time":
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        return `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}:${second.toString().padStart(2, "0")}`;

      case "number":
        return (Math.floor(Math.random() * 9000) + 1000).toString();

      case "custom":
        return customValue || "";

      default:
        return "Unknown data type";
    }
  }

  function renderFields() {
    fieldsDiv.innerHTML = "";
    for (const [index, field] of fields.entries()) {
      const row = document.createElement("div");
      row.className = "field-row";
      row.dataset.index = index;

      // Field Name
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Field name (e.g. firstName)";
      nameInput.value = field.name;
      nameInput.autocomplete = "off";
      nameInput.spellcheck = false;
      nameInput.required = true;
      nameInput.setAttribute("aria-label", `Field name ${index + 1}`);
      nameInput.addEventListener("input", (e) => {
        fields[index].name = e.target.value.trim();
      });

      // Type selector
      const typeSelect = document.createElement("select");
      typeSelect.setAttribute("aria-label", `Field type ${index + 1}`);
      for (const type of dataTypes) {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        if (field.type === type) option.selected = true;
        typeSelect.appendChild(option);
      }
      typeSelect.addEventListener("change", (e) => {
        fields[index].type = e.target.value;
        // Re-render to show/hide custom input
        renderFields();
      });

      // Custom input only for custom type
      let customInput;
      if (field.type === "custom") {
        customInput = document.createElement("input");
        customInput.type = "text";
        customInput.className = "custom-input";
        customInput.placeholder = "Custom value";
        customInput.value = field.customValue;
        customInput.setAttribute(
          "aria-label",
          `Custom value for field ${index + 1}`
        );
        customInput.addEventListener("input", (e) => {
          fields[index].customValue = e.target.value;
        });
      }

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-btn";
      removeBtn.setAttribute("aria-label", `Remove field ${index + 1}`);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        fields.splice(index, 1);
        renderFields();
      });

      row.appendChild(nameInput);
      row.appendChild(typeSelect);
      if (customInput) row.appendChild(customInput);
      row.appendChild(removeBtn);

      fieldsDiv.appendChild(row);
    }
  }

  // Initialize fields with default values
  let fields = [
    { name: "firstName", type: "name", customValue: "" },
    { name: "email", type: "email", customValue: "" },
  ];

  // Add event listeners
  addFieldBtn.addEventListener("click", () => {
    fields.push({ name: "", type: "name", customValue: "" });
    renderFields();
  });

  templateSelector.addEventListener("change", () => {
    const val = templateSelector.value;
    if (val !== "custom") {
      templateInput.value = templates[val] || "";
      templateInput.disabled = true;

      // Show or hide export button based on template selection
      exportBtn.style.display = val === "csv" ? "inline-block" : "none";
    } else {
      templateInput.value = "";
      templateInput.disabled = false;
      templateInput.focus();
      exportBtn.style.display = "none";
    }
  });

  // Variable to store CSV content for export
  let csvContent = "";

  generateBtn.addEventListener("click", () => {
    const count = Number(recordCountInput.value);
    if (!Number.isInteger(count) || count <= 0) {
      alert("Please enter a valid number of records (1 or more).");
      return;
    }

    // Validate fields
    for (const f of fields) {
      if (!f.name.trim()) {
        alert("Please provide a name for all fields.");
        return;
      }
    }

    // Generate data records
    const records = [];
    for (let i = 0; i < count; i++) {
      const record = {};
      for (const f of fields) {
        record[f.name] = generateFakeData(f.type, f.customValue);
      }
      records.push(record);
    }

    // Generate output based on format
    let output = "";
    let csvContent = ""; // Store CSV content separately for export

    // Special handling for JSON format - bypass templates for better reliability
    if (templateSelector.value === "json") {
      output = JSON.stringify(records, null, 2);
      exportBtn.style.display = "none";
    } else if (templateSelector.value === "csv") {
      // Direct CSV generation without templates
      // First add headers
      const headers = Object.keys(records[0] || {});
      csvContent = headers.join(",") + "\n";

      // Then add data rows
      records.forEach((record) => {
        const row = headers.map((key) => escapeCSV(record[key])).join(",");
        csvContent += row + "\n";
      });

      output = csvContent;
      exportBtn.style.display = "inline-block";
    } else if (templateSelector.value === "sql") {
      // Direct SQL generation without templates
      const headers = Object.keys(records[0] || {});
      output = `INSERT INTO table_name (${headers.join(", ")}) VALUES\n`;

      const rows = records.map((record) => {
        const values = headers
          .map((key) => `'${String(record[key]).replace(/'/g, "''")}'`)
          .join(", ");
        return `(${values})`;
      });

      output += rows.join(",\n") + ";";
    } else if (templateSelector.value === "custom") {
      // For custom templates
      output = "";
      const tpl = templateInput.value;

      for (let i = 0; i < records.length; i++) {
        let recordOutput = tpl;
        for (const [key, value] of Object.entries(records[i])) {
          const regex = new RegExp(`{{${key}}}`, "g");
          recordOutput = recordOutput.replace(regex, value);
        }
        output += recordOutput;
        if (i < records.length - 1) output += "\n";
      }
    }

    outputPre.textContent = output;
    outputPre.focus();

    // Show success modal with record count
    showModal(`Generated ${records.length} records successfully!`);
  });

  copyBtn.addEventListener("click", () => {
    const text = outputPre.textContent;
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
        showModal("Copied to clipboard successfully!");
      })
      .catch(() => {
        showModal("Failed to copy to clipboard");
      });
  });

  // Add event listener for the export button
  exportBtn.addEventListener("click", () => {
    const csvText = outputPre.textContent;
    if (!csvText) return;

    // Create a Blob with the CSV content
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });

    // Create a download link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Generate a filename with date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    const fileName = `data_export_${formattedDate}.csv`;

    // Set up link properties
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";

    // Append to document, click, then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showModal(`CSV file "${fileName}" is being downloaded`);
  });
});
