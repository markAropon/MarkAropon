document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const methodSelect = document.getElementById("method");
  const urlInput = document.getElementById("url");
  const contentTypeSelect = document.getElementById("contentType");
  const bodyTextarea = document.getElementById("body");
  const responsePre = document.getElementById("response");
  const sendButton = document.getElementById("send-request");
  const headersList = document.getElementById("headers-list");
  const formDataList = document.getElementById("form-data-list");
  const historyContainer = document.getElementById("history-container");
  const clearHistoryBtn = document.getElementById("clear-history");
  const saveRequestBtn = document.getElementById("save-request");
  const statusCodeElement = document.getElementById("status-code");
  const responseTimeElement = document.getElementById("response-time");
  const responseHeadersContent = document.getElementById(
    "response-headers-content"
  );
  const responseCookiesContent = document.getElementById(
    "response-cookies-content"
  );
  const generateFromResponseBtn = document.getElementById(
    "generate-from-response"
  );
  const customGeneratorBtn = document.getElementById("custom-generator");
  const customDataPanel = document.getElementById("custom-data-panel");
  const closeDataPanelBtn = document.getElementById("close-data-panel");
  const addDataFieldBtn = document.getElementById("add-data-field");
  const generateCustomDataBtn = document.getElementById("generate-custom-data");
  const resetDataFieldsBtn = document.getElementById("reset-data-fields");
  const dataFieldsContainer = document.getElementById("data-fields");
  const generateHeadersBtn = document.getElementById("generate-headers");

  // Initialize with example data
  urlInput.value = "https://jsonplaceholder.typicode.com/posts";
  methodSelect.value = "GET";
  // bodyTextarea.value = JSON.stringify({ title: "foo", body: "bar", userId: 1 }, null, 2 ); // Keep empty initially for cleaner UI

  // Store last response
  let lastResponse = null;

  // Collapse functionality
  document.querySelectorAll(".collapse-header").forEach((header) => {
    const content = header.nextElementSibling;
    const icon = header.querySelector("i.fas");

    // Set initial icon state based on content visibility
    if (content.classList.contains("default-open")) {
      // A class you can add to HTML for default open
      content.style.display = "block";
      if (icon) icon.className = "fas fa-chevron-down";
    } else {
      content.style.display = "none"; // Default to closed
      if (icon) icon.className = "fas fa-chevron-right";
    }

    header.addEventListener("click", () => {
      if (content.style.display === "none" || content.style.display === "") {
        content.style.display = "block";
        if (icon) icon.className = "fas fa-chevron-down"; // Points down when open
      } else {
        content.style.display = "none";
        if (icon) icon.className = "fas fa-chevron-right"; // Points right when closed
      }
    });
  });

  // Tab functionality for Request Body
  const requestBodyTabsContainer = document.getElementById("request-body-tabs");
  if (requestBodyTabsContainer) {
    const tabContentContainer = requestBodyTabsContainer.nextElementSibling; // Assuming .tab-content-container follows .tabs
    if (tabContentContainer) {
      requestBodyTabsContainer.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          const tabType = tab.getAttribute("data-tab");
          requestBodyTabsContainer
            .querySelectorAll(".tab")
            .forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          tabContentContainer
            .querySelectorAll(".tab-content")
            .forEach((content) => content.classList.remove("active"));
          const targetContent = tabContentContainer.querySelector(
            `#${tabType}-tab`
          );
          if (targetContent) targetContent.classList.add("active");
        });
      });
    }
  }

  // Tab functionality for Response View
  const responseViewTabsContainer =
    document.getElementById("response-view-tabs");
  if (responseViewTabsContainer) {
    const tabContentContainer = responseViewTabsContainer.nextElementSibling; // Assuming .tab-content-container follows .tabs
    if (tabContentContainer) {
      responseViewTabsContainer.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          const tabType = tab.getAttribute("data-tab");
          responseViewTabsContainer
            .querySelectorAll(".tab")
            .forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          tabContentContainer
            .querySelectorAll(".tab-content")
            .forEach((content) => content.classList.remove("active"));
          const targetContent = tabContentContainer.querySelector(
            `#response-${tabType}`
          ); // IDs are response-body, response-headers etc.
          if (targetContent) targetContent.classList.add("active");
        });
      });
    }
  }

  // Add header row
  document.querySelector(".add-header-btn").addEventListener("click", (e) => {
    e.preventDefault();
    addHeaderRow();
  });

  // Add form data row
  document
    .querySelector(".add-form-data-btn")
    .addEventListener("click", (e) => {
      e.preventDefault();
      addFormDataRow();
    });

  // Clear history
  clearHistoryBtn.addEventListener("click", (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-blue)",
      cancelButtonColor: "var(--error)",
      confirmButtonText: "Yes, clear it!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("apiHistory");
        historyContainer.innerHTML =
          '<div class="empty-state"><i class="fas fa-inbox"></i><p>No history yet</p></div>';
        Swal.fire(
          "Cleared!",
          "Your API request history has been cleared.",
          "success"
        );
      }
    });
  });

  // Save request
  saveRequestBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!urlInput.value) {
      Swal.fire({
        icon: "error",
        title: "Cannot Save",
        text: "Please enter a request URL before saving.",
      });
      return;
    }
    saveRequestToHistory();
    Swal.fire({
      icon: "success",
      title: "Request Saved!",
      text: "Your API request has been saved to history.",
    });
  });

  // Send request
  sendButton.addEventListener("click", async () => {
    await sendRequest();
  });

  // Generate from response button
  generateFromResponseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    generateDataFromResponse();
  });

  // Custom generator button
  customGeneratorBtn.addEventListener("click", (e) => {
    e.preventDefault();
    customDataPanel.style.display = "block";
  });

  // Close data panel
  closeDataPanelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    customDataPanel.style.display = "none";
  });

  // Add data field
  addDataFieldBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addDataFieldRow();
  });

  // Generate custom data
  generateCustomDataBtn.addEventListener("click", (e) => {
    e.preventDefault();
    generateCustomData();
  });

  // Reset data fields
  resetDataFieldsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    resetDataFields();
  });

  // Generate headers
  generateHeadersBtn.addEventListener("click", (e) => {
    e.preventDefault();
    generateCommonHeaders();
  });

  // Add initial rows
  addHeaderRow(true); // Pass true to make the first one non-removable initially
  addFormDataRow(true); // Same for form data
  addDataFieldRow(true); // Same for custom data fields

  // Load history
  loadHistory();

  // Helper Functions
  function addHeaderRow(isInitial = false) {
    const row = document.createElement("div");
    row.className = "header-item";
    row.innerHTML = `
              <input type="text" placeholder="Header name" class="header-key">
              <input type="text" placeholder="Header value" class="header-value">
              <button class="remove-header btn-small"><i class="fas fa-times"></i></button>
          `;
    headersList.appendChild(row);

    const removeBtn = row.querySelector(".remove-header");
    if (isInitial && headersList.children.length === 1) {
      removeBtn.disabled = true; // Disable remove for the very first row
      removeBtn.style.opacity = "0.5";
      removeBtn.style.cursor = "not-allowed";
    }

    removeBtn.addEventListener("click", () => {
      if (headersList.children.length > 1) {
        row.remove();
      }
      // Ensure the first row's remove button is disabled if it becomes the only one
      if (headersList.children.length === 1) {
        const firstRemoveBtn =
          headersList.children[0].querySelector(".remove-header");
        firstRemoveBtn.disabled = true;
        firstRemoveBtn.style.opacity = "0.5";
        firstRemoveBtn.style.cursor = "not-allowed";
      }
    });
    // Enable previously disabled remove buttons if more than one row exists
    if (headersList.children.length > 1) {
      Array.from(headersList.children).forEach((child) => {
        const btn = child.querySelector(".remove-header");
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        }
      });
    }
  }

  function addFormDataRow(isInitial = false) {
    const row = document.createElement("div");
    row.className = "header-item"; // Using .header-item for consistent styling
    row.innerHTML = `
              <input type="text" placeholder="Key" class="form-key">
              <input type="text" placeholder="Value" class="form-value">
              <button class="remove-form-data btn-small"><i class="fas fa-times"></i></button>
          `;
    formDataList.appendChild(row);

    const removeBtn = row.querySelector(".remove-form-data");
    if (isInitial && formDataList.children.length === 1) {
      removeBtn.disabled = true;
      removeBtn.style.opacity = "0.5";
      removeBtn.style.cursor = "not-allowed";
    }

    removeBtn.addEventListener("click", () => {
      if (formDataList.children.length > 1) {
        row.remove();
      }
      if (formDataList.children.length === 1) {
        const firstRemoveBtn =
          formDataList.children[0].querySelector(".remove-form-data");
        firstRemoveBtn.disabled = true;
        firstRemoveBtn.style.opacity = "0.5";
        firstRemoveBtn.style.cursor = "not-allowed";
      }
    });
    if (formDataList.children.length > 1) {
      Array.from(formDataList.children).forEach((child) => {
        const btn = child.querySelector(".remove-form-data");
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        }
      });
    }
  }

  function addDataFieldRow(isInitial = false) {
    const row = document.createElement("div");
    row.className = "data-gen-row";
    row.innerHTML = `
              <input type="text" placeholder="Field name (e.g. email)" class="data-field-name">
              <select class="data-field-type">
                  <option value="string">String</option>
                  <option value="email">Email</option>
                  <option value="name">Full Name</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                  <option value="id">ID</option>
                  <option value="url">URL</option>
              </select>
              <button class="remove-data-field btn-small"><i class="fas fa-times"></i></button>
          `;
    dataFieldsContainer.appendChild(row);

    const removeBtn = row.querySelector(".remove-data-field");
    if (isInitial && dataFieldsContainer.children.length === 1) {
      removeBtn.disabled = true;
      removeBtn.style.opacity = "0.5";
      removeBtn.style.cursor = "not-allowed";
    }
    removeBtn.addEventListener("click", () => {
      if (dataFieldsContainer.children.length > 1) {
        row.remove();
      }
      if (dataFieldsContainer.children.length === 1) {
        const firstRemoveBtn =
          dataFieldsContainer.children[0].querySelector(".remove-data-field");
        firstRemoveBtn.disabled = true;
        firstRemoveBtn.style.opacity = "0.5";
        firstRemoveBtn.style.cursor = "not-allowed";
      }
    });
    if (dataFieldsContainer.children.length > 1) {
      Array.from(dataFieldsContainer.children).forEach((child) => {
        const btn = child.querySelector(".remove-data-field");
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        }
      });
    }
  }

  function resetDataFields() {
    while (dataFieldsContainer.children.length > 0) {
      dataFieldsContainer.children[0].remove();
    }
    addDataFieldRow(true); // Add one non-removable row back
  }

  function getHeaders() {
    const headers = {};
    headersList.querySelectorAll(".header-item").forEach((item) => {
      const keyInput = item.querySelector(".header-key");
      const valueInput = item.querySelector(".header-value");
      if (keyInput && valueInput) {
        const key = keyInput.value.trim();
        const value = valueInput.value.trim(); // Trim header values too
        if (key && value) {
          // Only add if both key and value are present
          headers[key] = value;
        }
      }
    });
    return headers;
  }

  function getFormData() {
    const formData = new URLSearchParams();
    formDataList.querySelectorAll(".header-item").forEach((item) => {
      const keyInput = item.querySelector(".form-key");
      const valueInput = item.querySelector(".form-value");
      if (keyInput && valueInput) {
        const key = keyInput.value.trim();
        const value = valueInput.value; // Don't trim form data values, spaces might be intentional
        if (key) {
          // Key must be present
          formData.append(key, value);
        }
      }
    });
    return formData;
  }

  function getRequestBody() {
    const currentContentType = contentTypeSelect.value;
    const activeBodyTab = document.querySelector(
      "#request-body-tabs .tab.active"
    );
    const activeTabType = activeBodyTab
      ? activeBodyTab.getAttribute("data-tab")
      : "raw";

    if (
      currentContentType === "application/x-www-form-urlencoded" ||
      activeTabType === "form"
    ) {
      return getFormData().toString();
    }
    return bodyTextarea.value;
  }

  function saveRequestToHistory() {
    const request = {
      method: methodSelect.value,
      url: urlInput.value,
      headers: getHeaders(),
      body: bodyTextarea.value,
      formData: {},
      contentType: contentTypeSelect.value,
      activeBodyTab:
        document
          .querySelector("#request-body-tabs .tab.active")
          ?.getAttribute("data-tab") || "raw",
      timestamp: new Date().toISOString(),
    };

    if (
      request.contentType === "application/x-www-form-urlencoded" ||
      request.activeBodyTab === "form"
    ) {
      const fd = getFormData();
      request.body = fd.toString(); // Store string representation
      for (const [key, value] of fd.entries()) {
        // Store for easier reconstruction
        if (!request.formData[key]) request.formData[key] = [];
        request.formData[key].push(value);
      }
    }

    let history = JSON.parse(localStorage.getItem("apiHistory") || "[]");
    history.unshift(request);
    if (history.length > 20) history = history.slice(0, 20); // Increased history limit
    localStorage.setItem("apiHistory", JSON.stringify(history));
    loadHistory();
  }

  function loadHistory() {
    const history = JSON.parse(localStorage.getItem("apiHistory") || "[]");
    historyContainer.innerHTML = "";

    if (history.length === 0) {
      historyContainer.innerHTML =
        '<div class="empty-state"><i class="fas fa-inbox"></i><p>No history yet. Send some requests!</p></div>';
      return;
    }

    history.forEach((item) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";
      historyItem.innerHTML = `
                  <div>
                      <span class="history-method">${item.method}</span>
                      <span class="history-url">${item.url}</span>
                  </div>
                  <div>${new Date(item.timestamp).toLocaleString()}</div>
              `;

      historyItem.addEventListener("click", () => {
        methodSelect.value = item.method;
        urlInput.value = item.url;
        contentTypeSelect.value = item.contentType || "application/json";

        while (headersList.children.length > 0)
          headersList.children[0].remove();
        addHeaderRow(true); // Add one non-removable row
        if (item.headers && Object.keys(item.headers).length > 0) {
          if (
            headersList.children[0].querySelector(".header-key").value === "" &&
            headersList.children[0].querySelector(".header-value").value === ""
          ) {
            headersList.children[0].remove(); // Remove initial empty if loading saved
          }
          Object.entries(item.headers).forEach(([key, value]) =>
            addHeaderRowWithValue(key, value)
          );
        }

        while (formDataList.children.length > 0)
          formDataList.children[0].remove();
        addFormDataRow(true); // Add one non-removable row
        bodyTextarea.value = item.body || ""; // Default to raw

        if (
          (item.contentType === "application/x-www-form-urlencoded" ||
            item.activeBodyTab === "form") &&
          item.formData &&
          Object.keys(item.formData).length > 0
        ) {
          if (
            formDataList.children[0].querySelector(".form-key").value === ""
          ) {
            formDataList.children[0].remove(); // Remove initial empty
          }
          Object.entries(item.formData).forEach(([key, values]) => {
            (Array.isArray(values) ? values : [values]).forEach((value) =>
              addFormDataRowWithValue(key, value)
            );
          });
          document
            .querySelector('#request-body-tabs .tab[data-tab="form"]')
            .click();
        } else {
          document
            .querySelector('#request-body-tabs .tab[data-tab="raw"]')
            .click();
        }

        Swal.fire({
          icon: "success",
          title: "Request Loaded!",
          timer: 1500,
          showConfirmButton: false,
        });
      });
      historyContainer.appendChild(historyItem);
    });
  }
  // Helper for loading history with values
  function addHeaderRowWithValue(key, value) {
    addHeaderRow();
    const lastRow = headersList.lastElementChild;
    lastRow.querySelector(".header-key").value = key;
    lastRow.querySelector(".header-value").value = value;
  }
  function addFormDataRowWithValue(key, value) {
    addFormDataRow();
    const lastRow = formDataList.lastElementChild;
    lastRow.querySelector(".form-key").value = key;
    lastRow.querySelector(".form-value").value = value;
  }

  function syntaxHighlight(jsonInput) {
    let jsonStr = jsonInput;
    if (typeof jsonInput !== "string") {
      try {
        jsonStr = JSON.stringify(jsonInput, null, 2);
      } catch (e) {
        return String(jsonInput); // Fallback for non-serializable objects
      }
    } else {
      try {
        // If it's a string, try to parse and re-stringify for pretty printing
        const parsed = JSON.parse(jsonStr);
        jsonStr = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Not a JSON string, highlight as plain text (no specific highlighting here)
        // HTML escape the string to prevent XSS if it's not JSON
        const escaper = document.createElement("div");
        escaper.textContent = jsonStr;
        return escaper.innerHTML;
      }
    }

    return jsonStr.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        let cls = "number"; // Default class
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "key" : "string";
        } else if (/true|false/.test(match)) {
          cls = "boolean";
        } else if (/null/.test(match)) {
          cls = "null";
        }
        const escaper = document.createElement("div");
        escaper.textContent = match;
        return `<span class="${cls}">${escaper.innerHTML}</span>`;
      }
    );
  }

  async function sendRequest() {
    const method = methodSelect.value;
    const url = urlInput.value;

    if (!url) {
      Swal.fire({
        icon: "error",
        title: "Missing URL",
        text: "Please enter a request URL.",
      });
      return;
    }

    const requestHeaders = getHeaders();
    const currentContentType = contentTypeSelect.value;
    // Ensure Content-Type is set based on dropdown if not explicitly in headers
    if (
      !Object.keys(requestHeaders).some(
        (k) => k.toLowerCase() === "content-type"
      )
    ) {
      if (
        (method === "POST" || method === "PUT" || method === "PATCH") &&
        (currentContentType === "application/json" ||
          currentContentType === "application/xml" ||
          currentContentType === "text/plain" ||
          currentContentType === "application/x-www-form-urlencoded")
      ) {
        requestHeaders["Content-Type"] = currentContentType;
      }
    }

    const body = getRequestBody();

    responsePre.innerHTML = syntaxHighlight("Sending request...");
    statusCodeElement.textContent = "---";
    statusCodeElement.className = "status-code"; // Reset class
    responseTimeElement.textContent = "Time: ---";
    responseHeadersContent.textContent = "(Waiting for headers...)";
    responseCookiesContent.textContent = "(Waiting for cookies...)";
    const startTime = performance.now();

    try {
      const fetchOptions = { method, headers: requestHeaders };
      if (["POST", "PUT", "PATCH"].includes(method) && body) {
        fetchOptions.body = body;
      }

      const response = await fetch(url, fetchOptions);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const statusClass =
        response.status >= 200 && response.status < 300
          ? "status-2xx"
          : response.status >= 400 && response.status < 500
          ? "status-4xx"
          : response.status >= 300 && response.status < 400
          ? "status-3xx" // Added for redirects
          : "status-5xx";

      statusCodeElement.textContent = `${response.status} ${response.statusText}`;
      statusCodeElement.className = `status-code ${statusClass}`;
      responseTimeElement.textContent = `Time: ${responseTime}ms`;

      const respHeadersObj = {};
      response.headers.forEach((value, name) => (respHeadersObj[name] = value));
      responseHeadersContent.innerHTML = syntaxHighlight(respHeadersObj);

      const cookies = document.cookie ? document.cookie.split("; ") : [];
      responseCookiesContent.textContent =
        cookies.length > 0
          ? cookies.join("\n")
          : "(No client-accessible cookies for this domain)";

      const responseBodyText = await response.text();
      lastResponse = responseBodyText; // Store raw text first

      const responseContentTypeHeader =
        response.headers.get("content-type") || "";
      if (responseContentTypeHeader.includes("application/json")) {
        try {
          const jsonData = JSON.parse(responseBodyText);
          responsePre.innerHTML = syntaxHighlight(jsonData);
          lastResponse = jsonData; // Update with parsed if successful
        } catch (e) {
          responsePre.innerHTML = syntaxHighlight(responseBodyText); // Show raw but highlighted
          console.error("Failed to parse JSON response:", e);
        }
      } else {
        // For XML, HTML, Text etc.
        responsePre.innerHTML = syntaxHighlight(responseBodyText);
      }

      if (
        !responseBodyText &&
        responsePre.innerHTML.includes("Sending request...")
      ) {
        responsePre.textContent = "(Empty Response Body)";
      }

      saveRequestToHistory();
      if (window.Swal && response.ok) {
        Swal.fire({
          icon: "success",
          title: "Request Successful!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else if (window.Swal && !response.ok) {
        Swal.fire({
          icon: "warning",
          title: "Request Completed",
          text: `Status: ${response.status} ${response.statusText}`,
          timer: 2500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      const endTime = performance.now();
      responseTimeElement.textContent = `Time: ${Math.round(
        endTime - startTime
      )}ms (Error)`;
      statusCodeElement.textContent = "Network Error";
      statusCodeElement.className = "status-code status-5xx";
      responsePre.textContent =
        "Request error: " +
        err.message +
        "\n\nCheck console for more details and ensure CORS is handled if it's a cross-origin request.";
      lastResponse = null;
      console.error("Fetch Error:", err);
      if (window.Swal) {
        Swal.fire({ icon: "error", title: "Request Error", text: err.message });
      }
    }
  }

  function generateDataFromResponse() {
    if (!lastResponse) {
      Swal.fire({
        icon: "warning",
        title: "No Response Data",
        text: "Send a request first.",
      });
      return;
    }
    let dataToProcess = lastResponse;
    if (typeof lastResponse === "string") {
      try {
        dataToProcess = JSON.parse(lastResponse);
      } catch (e) {
        Swal.fire({
          icon: "error",
          title: "Not JSON",
          text: "Last response isn't valid JSON.",
        });
        return;
      }
    }
    try {
      const sampleData = createSampleFromResponse(dataToProcess);
      bodyTextarea.value = JSON.stringify(sampleData, null, 2);
      contentTypeSelect.value = "application/json";
      document.querySelector('#request-body-tabs .tab[data-tab="raw"]').click();
      Swal.fire({
        icon: "success",
        title: "Data Generated!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Generation Error", text: e.message });
    }
  }

  function createSampleFromResponse(responseObj) {
    if (Array.isArray(responseObj)) {
      return responseObj.length > 0
        ? [createSampleFromObject(responseObj[0])]
        : [];
    } else if (typeof responseObj === "object" && responseObj !== null) {
      return createSampleFromObject(responseObj);
    }
    return generateSampleValue("unknown", typeof responseObj);
  }

  function createSampleFromObject(obj) {
    const sample = {};
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === "object" && value !== null) {
          sample[key] = Array.isArray(value)
            ? value.length > 0
              ? [createSampleFromObject(value[0])]
              : []
            : createSampleFromObject(value);
        } else {
          sample[key] = generateSampleValue(key, typeof value);
        }
      }
    }
    return sample;
  }

  function generateSampleValue(fieldName, type) {
    fieldName = fieldName.toLowerCase();
    if (fieldName.includes("email")) return "example@email.com";
    if (fieldName.includes("name"))
      return fieldName.includes("first")
        ? "John"
        : fieldName.includes("last")
        ? "Doe"
        : "John Doe";
    if (fieldName.includes("date") || fieldName.includes("time"))
      return new Date().toISOString();
    if (fieldName.includes("url")) return "https://example.com";
    if (fieldName.includes("phone")) return "+15551234567";
    if (fieldName.includes("id") || fieldName.endsWith("_id"))
      return Math.floor(Math.random() * 10000);
    if (
      fieldName.includes("price") ||
      fieldName.includes("amount") ||
      fieldName.includes("value")
    )
      return parseFloat((Math.random() * 100).toFixed(2));
    if (
      fieldName.includes("is_") ||
      fieldName.startsWith("is") ||
      fieldName.includes("active") ||
      fieldName.includes("enabled")
    )
      return true;
    switch (type) {
      case "string":
        return "sample string";
      case "number":
        return Math.floor(Math.random() * 100);
      case "boolean":
        return Math.random() < 0.5;
      default:
        return null;
    }
  }

  function generateCustomData() {
    const data = {};
    let hasErrors = false;
    document.querySelectorAll(".data-gen-row").forEach((row) => {
      const nameInput = row.querySelector(".data-field-name");
      const typeSelect = row.querySelector(".data-field-type");
      const name = nameInput.value.trim();
      nameInput.style.borderColor = ""; // Reset border
      if (!name) {
        nameInput.style.borderColor = "var(--error)";
        hasErrors = true;
        return;
      }
      data[name] = generateSampleValue(name, typeSelect.value); // Use existing generator
    });

    if (hasErrors) {
      Swal.fire({
        icon: "error",
        title: "Missing Field Names",
        text: "Please name all fields.",
      });
      return;
    }
    bodyTextarea.value = JSON.stringify(data, null, 2);
    contentTypeSelect.value = "application/json";
    document.querySelector('#request-body-tabs .tab[data-tab="raw"]').click();
    customDataPanel.style.display = "none";
    Swal.fire({
      icon: "success",
      title: "Custom Data Generated!",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  function generateCommonHeaders() {
    const currentContentType = contentTypeSelect.value;
    while (headersList.children.length > 0) headersList.children[0].remove();
    const common = [
      { key: "Accept", value: "application/json, text/plain, */*" },
    ];
    if (
      (methodSelect.value === "POST" ||
        methodSelect.value === "PUT" ||
        methodSelect.value === "PATCH") &&
      (currentContentType === "application/json" ||
        currentContentType === "application/xml" ||
        currentContentType === "text/plain" ||
        currentContentType === "application/x-www-form-urlencoded")
    ) {
      common.unshift({ key: "Content-Type", value: currentContentType });
    }

    common.forEach((header) => addHeaderRowWithValue(header.key, header.value));
    if (headersList.children.length === 0) addHeaderRow(true); // Ensure one if all removed/none added

    Swal.fire({
      icon: "success",
      title: "Headers Generated!",
      timer: 1500,
      showConfirmButton: false,
    });
  }
});
