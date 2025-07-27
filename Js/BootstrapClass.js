class BootstrapClassGenerator {
  constructor() {
    this.currentFramework = "bootstrap";
    this.selectedElement = null;
    this.elementCounter = 0;
    this.canvasElements = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.updateGeneratedCode();
  }

  setupEventListeners() {
    const events = [
      ["frameworkToggle", "click", () => this.toggleFramework()],
      ["clearCanvas", "click", () => this.clearCanvas()],
      ["exportBtn", "click", () => this.exportCode()],
      ["copyCode", "click", () => this.copyCode()],
      ["previewCode", "click", () => this.showPreview()],
      ["closeProperties", "click", () => this.closePropertiesPanel()],
      ["closePreview", "click", () => this.closePreview()],
      [
        "componentSearch",
        "input",
        (e) => this.searchComponents(e.target.value),
      ],
    ];

    events.forEach(([id, event, handler]) => {
      const element = document.getElementById(id);
      if (element) element.addEventListener(event, handler);
    });

    // Properties toggle for mobile
    const propertiesToggle = document.getElementById("propertiesToggle");
    if (propertiesToggle) {
      propertiesToggle.addEventListener("click", () =>
        this.togglePropertiesPanel()
      );
    }

    // Viewport controls
    document.querySelectorAll(".viewport-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.changeViewport(e.target.dataset.viewport)
      );
    });

    // Category toggles
    document.querySelectorAll(".category-header").forEach((header) => {
      header.addEventListener("click", () =>
        this.toggleCategory(header.parentElement)
      );
    });
  }

  setupDragAndDrop() {
    const canvas = document.getElementById("canvas");

    // Make component items draggable
    document.querySelectorAll(".component-item").forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.component);
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => item.classList.remove("dragging"));
    });

    // Canvas drop zone
    canvas.addEventListener("dragover", (e) => {
      e.preventDefault();
      canvas.classList.add("drag-over");
    });
    canvas.addEventListener("dragleave", () =>
      canvas.classList.remove("drag-over")
    );
    canvas.addEventListener("drop", (e) => {
      e.preventDefault();
      canvas.classList.remove("drag-over");
      this.addComponentToCanvas(e.dataTransfer.getData("text/plain"));
    });
  }

  toggleFramework() {
    this.currentFramework =
      this.currentFramework === "bootstrap" ? "tailwind" : "bootstrap";
    const frameworkName = document.querySelector(
      "#frameworkToggle .framework-name"
    );
    if (frameworkName) {
      frameworkName.textContent =
        this.currentFramework === "bootstrap" ? "Bootstrap" : "Tailwind";
    }

    this.canvasElements.forEach((element) =>
      this.updateElementClasses(element)
    );
    this.updateGeneratedCode();
  }

  addComponentToCanvas(componentType) {
    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    const element = this.createElement(componentType);
    canvas.appendChild(element);
    canvas.classList.add("has-content");
    this.canvasElements.push(element);
    this.updateGeneratedCode();
  }

  createElement(type) {
    try {
      const element = this.createElementContent(type);
      element.className = (element.className || "") + " canvas-element";
      element.dataset.elementId = ++this.elementCounter;
      element.dataset.elementType = type;

      const controls = document.createElement("div");
      controls.className = "element-controls";
      controls.innerHTML = `
        <button class="control-btn edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="control-btn delete">
          <i class="fas fa-trash"></i>
        </button>
      `;

      // Add event listeners directly instead of inline onclick
      const editBtn = controls.querySelector(".edit");
      const deleteBtn = controls.querySelector(".delete");

      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.editElement(element);
      });

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteElement(element);
      });

      element.appendChild(controls);

      element.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectElement(element);
      });

      return element;
    } catch (error) {
      console.error("Error creating element:", error);
      const errorDiv = document.createElement("div");
      errorDiv.className = "canvas-element";
      errorDiv.textContent = `Error creating ${type}`;
      return errorDiv;
    }
  }

  createElementContent(type) {
    const templates = {
      bootstrap: {
        container: () => this.createDiv("container", "Container"),
        row: () => this.createDiv("row", '<div class="col">Row</div>'),
        column: () => this.createDiv("col-md-6", "Column"),
        flex: () =>
          this.createDiv(
            "d-flex justify-content-center align-items-center",
            "Flex Container",
            "100px"
          ),
        heading: () => this.createHeading("h2", "Heading Text"),
        paragraph: () => this.createP("", "This is a paragraph of text."),
        button: () => this.createButton("btn btn-primary", "Button"),
        image: () => this.createImg("img-fluid"),
        input: () => this.createInput("form-control"),
        textarea: () => this.createTextarea("form-control"),
        select: () => this.createSelect("form-select"),
        checkbox: () => this.createCheckbox("form-check"),
        card: () => this.createCard("bootstrap"),
        alert: () =>
          this.createDiv("alert alert-primary", "This is an alert message."),
        badge: () => this.createSpan("badge bg-primary", "Badge"),
        progress: () => this.createProgress("bootstrap"),
      },
      tailwind: {
        container: () => this.createDiv("container mx-auto px-4", "Container"),
        row: () =>
          this.createDiv("flex flex-wrap", '<div class="w-full">Row</div>'),
        column: () => this.createDiv("w-full md:w-1/2", "Column"),
        flex: () =>
          this.createDiv(
            "flex justify-center items-center min-h-24",
            "Flex Container"
          ),
        heading: () =>
          this.createHeading("h2", "Heading Text", "text-2xl font-bold"),
        paragraph: () =>
          this.createP("text-base", "This is a paragraph of text."),
        button: () =>
          this.createButton(
            "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
            "Button"
          ),
        image: () => this.createImg("w-full h-auto"),
        input: () =>
          this.createInput(
            "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          ),
        textarea: () =>
          this.createTextarea(
            "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          ),
        select: () =>
          this.createSelect(
            "block appearance-none w-full bg-white border border-gray-400 px-4 py-2 rounded"
          ),
        checkbox: () => this.createCheckbox("flex items-center"),
        card: () => this.createCard("tailwind"),
        alert: () =>
          this.createDiv(
            "bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded",
            "This is an alert message."
          ),
        badge: () =>
          this.createSpan(
            "inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-full",
            "Badge"
          ),
        progress: () => this.createProgress("tailwind"),
      },
    };

    return (
      templates[this.currentFramework]?.[type]?.() ||
      document.createElement("div")
    );
  }

  // Helper methods for creating elements
  createDiv(className, content, minHeight) {
    const div = document.createElement("div");
    div.className = className;
    div.innerHTML = content.includes("<")
      ? content
      : `<p class="text-muted">${content}</p>`;
    if (minHeight) div.style.minHeight = minHeight;
    return div;
  }

  createHeading(tag, text, className = "") {
    const h = document.createElement(tag);
    h.className =
      className ||
      (this.currentFramework === "bootstrap" ? "h2" : "text-2xl font-bold");
    h.textContent = text;
    return h;
  }

  createP(className, text) {
    const p = document.createElement("p");
    p.className = className;
    p.textContent = text;
    return p;
  }

  createButton(className, text) {
    const btn = document.createElement("button");
    btn.className = className;
    btn.textContent = text;
    return btn;
  }

  createImg(className) {
    const img = document.createElement("img");
    img.className = className;
    img.src = "https://via.placeholder.com/300x200";
    img.alt = "Placeholder Image";
    return img;
  }

  createInput(className) {
    const input = document.createElement("input");
    input.className = className;
    input.type = "text";
    input.placeholder = "Enter text...";
    return input;
  }

  createTextarea(className) {
    const textarea = document.createElement("textarea");
    textarea.className = className;
    textarea.placeholder = "Enter your message...";
    textarea.rows = 3;
    return textarea;
  }

  createSelect(className) {
    const select = document.createElement("select");
    select.className = className;
    select.innerHTML = `
      <option>Choose...</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    `;
    return select;
  }

  createCheckbox(className) {
    const wrapper = document.createElement(
      this.currentFramework === "bootstrap" ? "div" : "label"
    );
    wrapper.className = className;
    wrapper.innerHTML =
      this.currentFramework === "bootstrap"
        ? '<input class="form-check-input" type="checkbox" id="checkbox1"><label class="form-check-label" for="checkbox1">Check me</label>'
        : '<input type="checkbox" class="form-checkbox h-5 w-5 text-blue-600"><span class="ml-2 text-gray-700">Check me</span>';
    return wrapper;
  }

  createCard(framework) {
    const div = document.createElement("div");
    if (framework === "bootstrap") {
      div.className = "card";
      div.style.width = "18rem";
      div.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">Card Title</h5>
          <p class="card-text">Some quick example text.</p>
          <a href="#" class="btn btn-primary">Go somewhere</a>
        </div>
      `;
    } else {
      div.className = "max-w-sm rounded overflow-hidden shadow-lg";
      div.innerHTML = `
        <div class="px-6 py-4">
          <div class="font-bold text-xl mb-2">Card Title</div>
          <p class="text-gray-700 text-base">Some quick example text.</p>
        </div>
        <div class="px-6 pt-4 pb-2">
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Go somewhere</button>
        </div>
      `;
    }
    return div;
  }

  createSpan(className, text) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  }

  createProgress(framework) {
    const div = document.createElement("div");
    if (framework === "bootstrap") {
      div.className = "progress";
      div.innerHTML =
        '<div class="progress-bar" role="progressbar" style="width: 50%"></div>';
    } else {
      div.className = "w-full bg-gray-200 rounded-full h-2.5";
      div.innerHTML =
        '<div class="bg-blue-600 h-2.5 rounded-full" style="width: 50%"></div>';
    }
    return div;
  }

  updateElementClasses(element) {
    const type = element.dataset.elementType;
    const newContent = this.createElementContent(type);
    const controls = element.querySelector(".element-controls");
    const { elementId } = element.dataset;
    const editorClasses = Array.from(element.classList).filter(
      (cls) =>
        cls.includes("canvas-element") ||
        cls.includes("diff-") ||
        cls.includes("selected")
    );

    element.innerHTML = newContent.innerHTML;
    element.className = newContent.className;

    editorClasses.forEach((cls) => element.classList.add(cls));
    element.dataset.elementId = elementId;
    element.dataset.elementType = type;

    if (controls) element.appendChild(controls);
  }

  selectElement(element) {
    document
      .querySelectorAll(".canvas-element.selected")
      .forEach((el) => el.classList.remove("selected"));
    element.classList.add("selected");
    this.selectedElement = element;
    this.showPropertiesPanel(element);
  }

  editElement(element) {
    this.selectElement(element);
  }

  deleteElement(element) {
    const index = this.canvasElements.indexOf(element);
    if (index > -1) this.canvasElements.splice(index, 1);

    element.remove();
    this.closePropertiesPanel();
    this.updateGeneratedCode();

    if (this.canvasElements.length === 0) {
      document.getElementById("canvas").classList.remove("has-content");
    }
  }

  showPropertiesPanel(element) {
    const panel = document.getElementById("propertiesPanel");
    const content = document.getElementById("propertiesContent");

    panel.classList.remove("hidden");
    panel.classList.add("visible", "open");
    content.innerHTML = this.generatePropertiesForm(element);

    const toggleBtn = document.getElementById("propertiesToggle");
    if (toggleBtn) toggleBtn.classList.add("active");

    this.preselectCurrentValues(element);
    this.addPropertyEventListeners(element, content);
  }

  addPropertyEventListeners(element, content) {
    content.querySelectorAll("input, select").forEach((input) => {
      ["input", "change"].forEach((event) => {
        input.addEventListener(event, () =>
          this.updateElementProperty(element, input)
        );
      });
    });

    content.querySelectorAll(".position-cell").forEach((cell) => {
      cell.addEventListener("click", () => {
        content
          .querySelectorAll(".position-cell")
          .forEach((c) => c.classList.remove("selected"));
        cell.classList.add("selected");
        this.applyPositionClasses(element, cell.dataset.classes.split(" "));
      });
    });

    content.querySelectorAll(".alignment-option").forEach((option) => {
      option.addEventListener("click", () => {
        const category = option.dataset.align.split("-")[0];
        content.querySelectorAll(".alignment-option").forEach((opt) => {
          if (opt.dataset.align.startsWith(category))
            opt.classList.remove("selected");
        });
        option.classList.add("selected");
        this.applyAlignmentClasses(
          element,
          option.dataset.classes.split(" "),
          category
        );
      });
    });
  }

  applyPositionClasses(element, classes) {
    this.removePositionClasses(element);
    classes.forEach((cls) => cls.trim() && element.classList.add(cls.trim()));
    this.updateGeneratedCode();
  }

  applyAlignmentClasses(element, classes, category) {
    this.removeAlignmentClasses(element, category);
    classes.forEach((cls) => cls.trim() && element.classList.add(cls.trim()));
    this.updateGeneratedCode();
  }

  removePositionClasses(element) {
    const positionClasses =
      this.currentFramework === "bootstrap"
        ? [
            "top-0",
            "bottom-0",
            "start-0",
            "end-0",
            "start-50",
            "top-50",
            "translate-middle",
            "translate-middle-x",
            "translate-middle-y",
          ]
        : [
            "top-0",
            "bottom-0",
            "left-0",
            "right-0",
            "left-1/2",
            "top-1/2",
            "transform",
            "-translate-x-1/2",
            "-translate-y-1/2",
          ];

    positionClasses.forEach((cls) => element.classList.remove(cls));
  }

  removeAlignmentClasses(element, category) {
    const alignmentClasses = {
      text:
        this.currentFramework === "bootstrap"
          ? ["text-start", "text-center", "text-end"]
          : ["text-left", "text-center", "text-right"],
      justify:
        this.currentFramework === "bootstrap"
          ? [
              "justify-content-start",
              "justify-content-center",
              "justify-content-end",
            ]
          : ["justify-start", "justify-center", "justify-end"],
      items:
        this.currentFramework === "bootstrap"
          ? ["align-items-start", "align-items-center", "align-items-end"]
          : ["items-start", "items-center", "items-end"],
    };

    if (alignmentClasses[category]) {
      alignmentClasses[category].forEach((cls) =>
        element.classList.remove(cls)
      );
    }
  }

  preselectCurrentValues(element) {
    const classList = Array.from(element.classList);
    const classMapping = this.getClassMapping();

    Object.keys(classMapping).forEach((property) => {
      const currentClass = classList.find((cls) =>
        classMapping[property].includes(cls)
      );
      if (currentClass) {
        const select = document.getElementById(property);
        if (select) select.value = currentClass;
      }
    });
  }

  getClassMapping() {
    return this.currentFramework === "bootstrap"
      ? {
          fontSize: ["fs-1", "fs-2", "fs-3", "fs-4", "fs-5", "fs-6"],
          fontWeight: [
            "fw-light",
            "fw-normal",
            "fw-medium",
            "fw-bold",
            "fw-bolder",
          ],
          textAlign: ["text-start", "text-center", "text-end"],
          textColor: [
            "text-primary",
            "text-secondary",
            "text-success",
            "text-danger",
            "text-warning",
            "text-info",
            "text-light",
            "text-dark",
            "text-muted",
          ],
          margin: ["m-0", "m-1", "m-2", "m-3", "m-4", "m-5"],
          padding: ["p-0", "p-1", "p-2", "p-3", "p-4", "p-5"],
          backgroundColor: [
            "bg-primary",
            "bg-secondary",
            "bg-success",
            "bg-danger",
            "bg-warning",
            "bg-info",
            "bg-light",
            "bg-dark",
            "bg-white",
          ],
          border: [
            "border",
            "border-top",
            "border-bottom",
            "border-start",
            "border-end",
          ],
          borderRadius: [
            "rounded",
            "rounded-0",
            "rounded-1",
            "rounded-2",
            "rounded-3",
            "rounded-pill",
            "rounded-circle",
          ],
          position: [
            "position-static",
            "position-relative",
            "position-absolute",
            "position-fixed",
            "position-sticky",
          ],
          display: [
            "d-block",
            "d-inline",
            "d-inline-block",
            "d-flex",
            "d-grid",
            "d-none",
          ],
        }
      : {
          fontSize: [
            "text-xs",
            "text-sm",
            "text-base",
            "text-lg",
            "text-xl",
            "text-2xl",
            "text-3xl",
            "text-4xl",
          ],
          fontWeight: [
            "font-thin",
            "font-light",
            "font-normal",
            "font-medium",
            "font-semibold",
            "font-bold",
            "font-extrabold",
          ],
          textAlign: ["text-left", "text-center", "text-right", "text-justify"],
          textColor: [
            "text-blue-500",
            "text-green-500",
            "text-red-500",
            "text-yellow-500",
            "text-purple-500",
            "text-pink-500",
            "text-gray-500",
            "text-black",
            "text-white",
          ],
          margin: ["m-0", "m-1", "m-2", "m-4", "m-6", "m-8"],
          padding: ["p-0", "p-1", "p-2", "p-4", "p-6", "p-8"],
          backgroundColor: [
            "bg-blue-500",
            "bg-green-500",
            "bg-red-500",
            "bg-yellow-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-gray-100",
            "bg-gray-800",
            "bg-white",
            "bg-black",
          ],
          border: [
            "border",
            "border-t",
            "border-b",
            "border-l",
            "border-r",
            "border-2",
          ],
          borderRadius: [
            "rounded",
            "rounded-none",
            "rounded-sm",
            "rounded-md",
            "rounded-lg",
            "rounded-xl",
            "rounded-full",
          ],
          position: ["static", "relative", "absolute", "fixed", "sticky"],
          display: [
            "block",
            "inline",
            "inline-block",
            "flex",
            "grid",
            "hidden",
          ],
        };
  }

  generatePropertiesForm(element) {
    const type = element.dataset.elementType;
    let form = `
      <div class="property-group">
        <h4>General</h4>
        <div class="property-item">
          <label>Element Type</label>
          <input type="text" value="${type}" readonly>
        </div>
      </div>
    `;

    // Add type-specific properties
    form += this.getTypeSpecificProperties(element, type);
    form += this.getTypographyProperties();
    form += this.getSpacingProperties();
    form += this.getBackgroundProperties();
    form += this.getBorderProperties();
    form += this.getPositionProperties();

    if (type === "flex" || type === "row") {
      form += this.getFlexProperties();
    }

    return form;
  }

  getTypeSpecificProperties(element, type) {
    if (type === "heading") {
      return `
        <div class="property-group">
          <h4>Text Content</h4>
          <div class="property-item">
            <label>Text</label>
            <input type="text" id="textContent" value="${element.textContent}">
          </div>
          <div class="property-item">
            <label>Heading Level</label>
            <select id="headingLevel">
              ${["h1", "h2", "h3", "h4", "h5", "h6"]
                .map(
                  (tag) =>
                    `<option value="${tag}" ${
                      element.tagName === tag.toUpperCase() ? "selected" : ""
                    }>${tag.toUpperCase()}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>
      `;
    }

    if (type === "paragraph" || type === "button") {
      return `
        <div class="property-group">
          <h4>Text Content</h4>
          <div class="property-item">
            <label>Text</label>
            <input type="text" id="textContent" value="${element.textContent}">
          </div>
        </div>
      `;
    }

    if (type === "image") {
      return `
        <div class="property-group">
          <h4>Image Properties</h4>
          <div class="property-item">
            <label>Image URL</label>
            <input type="url" id="imageSrc" value="${element.src}">
          </div>
          <div class="property-item">
            <label>Alt Text</label>
            <input type="text" id="imageAlt" value="${element.alt}">
          </div>
        </div>
      `;
    }

    return "";
  }

  getTypographyProperties() {
    const isBootstrap = this.currentFramework === "bootstrap";
    return `
      <div class="property-group">
        <h4>Typography</h4>
        ${this.createSelectProperty(
          "fontSize",
          "Font Size",
          isBootstrap
            ? [
                ["fs-1", "Extra Large"],
                ["fs-2", "Large"],
                ["fs-3", "Medium"],
                ["fs-4", "Normal"],
                ["fs-5", "Small"],
                ["fs-6", "Extra Small"],
              ]
            : [
                ["text-xs", "Extra Small"],
                ["text-sm", "Small"],
                ["text-base", "Base"],
                ["text-lg", "Large"],
                ["text-xl", "Extra Large"],
                ["text-2xl", "2X Large"],
              ]
        )}
        ${this.createSelectProperty(
          "fontWeight",
          "Font Weight",
          isBootstrap
            ? [
                ["fw-light", "Light"],
                ["fw-normal", "Normal"],
                ["fw-medium", "Medium"],
                ["fw-bold", "Bold"],
                ["fw-bolder", "Bolder"],
              ]
            : [
                ["font-thin", "Thin"],
                ["font-light", "Light"],
                ["font-normal", "Normal"],
                ["font-medium", "Medium"],
                ["font-semibold", "Semi Bold"],
                ["font-bold", "Bold"],
              ]
        )}
        ${this.createSelectProperty(
          "textAlign",
          "Text Alignment",
          isBootstrap
            ? [
                ["text-start", "Left"],
                ["text-center", "Center"],
                ["text-end", "Right"],
              ]
            : [
                ["text-left", "Left"],
                ["text-center", "Center"],
                ["text-right", "Right"],
                ["text-justify", "Justify"],
              ]
        )}
        ${this.createSelectProperty(
          "textColor",
          "Text Color",
          isBootstrap
            ? [
                ["text-primary", "Primary"],
                ["text-secondary", "Secondary"],
                ["text-success", "Success"],
                ["text-danger", "Danger"],
              ]
            : [
                ["text-blue-500", "Blue"],
                ["text-green-500", "Green"],
                ["text-red-500", "Red"],
                ["text-yellow-500", "Yellow"],
              ]
        )}
      </div>
    `;
  }

  getSpacingProperties() {
    const isBootstrap = this.currentFramework === "bootstrap";
    return `
      <div class="property-group">
        <h4>Spacing</h4>
        ${this.createSelectProperty(
          "margin",
          "Margin",
          isBootstrap
            ? [
                ["m-1", "Small"],
                ["m-2", "Medium"],
                ["m-3", "Large"],
                ["m-4", "Extra Large"],
                ["m-5", "Huge"],
              ]
            : [
                ["m-1", "Small"],
                ["m-2", "Medium"],
                ["m-4", "Large"],
                ["m-6", "Extra Large"],
                ["m-8", "Huge"],
              ]
        )}
        ${this.createSelectProperty(
          "padding",
          "Padding",
          isBootstrap
            ? [
                ["p-1", "Small"],
                ["p-2", "Medium"],
                ["p-3", "Large"],
                ["p-4", "Extra Large"],
                ["p-5", "Huge"],
              ]
            : [
                ["p-1", "Small"],
                ["p-2", "Medium"],
                ["p-4", "Large"],
                ["p-6", "Extra Large"],
                ["p-8", "Huge"],
              ]
        )}
      </div>
    `;
  }

  getBackgroundProperties() {
    const isBootstrap = this.currentFramework === "bootstrap";
    return `
      <div class="property-group">
        <h4>Background & Colors</h4>
        ${this.createSelectProperty(
          "backgroundColor",
          "Background Color",
          isBootstrap
            ? [
                ["bg-primary", "Primary"],
                ["bg-secondary", "Secondary"],
                ["bg-success", "Success"],
                ["bg-danger", "Danger"],
                ["bg-light", "Light"],
                ["bg-dark", "Dark"],
              ]
            : [
                ["bg-blue-500", "Blue"],
                ["bg-green-500", "Green"],
                ["bg-red-500", "Red"],
                ["bg-yellow-500", "Yellow"],
                ["bg-gray-100", "Light Gray"],
                ["bg-gray-800", "Dark Gray"],
              ]
        )}
      </div>
    `;
  }

  getBorderProperties() {
    const isBootstrap = this.currentFramework === "bootstrap";
    return `
      <div class="property-group">
        <h4>Border & Effects</h4>
        ${this.createSelectProperty(
          "border",
          "Border",
          isBootstrap
            ? [
                ["border", "All Sides"],
                ["border-top", "Top"],
                ["border-bottom", "Bottom"],
                ["border-start", "Left"],
                ["border-end", "Right"],
              ]
            : [
                ["border", "All Sides"],
                ["border-t", "Top"],
                ["border-b", "Bottom"],
                ["border-l", "Left"],
                ["border-r", "Right"],
              ]
        )}
        ${this.createSelectProperty(
          "borderRadius",
          "Border Radius",
          isBootstrap
            ? [
                ["rounded", "Default"],
                ["rounded-0", "None"],
                ["rounded-1", "Small"],
                ["rounded-pill", "Pill"],
                ["rounded-circle", "Circle"],
              ]
            : [
                ["rounded", "Default"],
                ["rounded-none", "None"],
                ["rounded-sm", "Small"],
                ["rounded-lg", "Large"],
                ["rounded-full", "Full"],
              ]
        )}
        ${this.createSelectProperty(
          "shadow",
          "Shadow",
          isBootstrap
            ? [
                ["shadow-sm", "Small"],
                ["shadow", "Default"],
                ["shadow-lg", "Large"],
              ]
            : [
                ["shadow-sm", "Small"],
                ["shadow", "Default"],
                ["shadow-md", "Medium"],
                ["shadow-lg", "Large"],
              ]
        )}
      </div>
    `;
  }

  getPositionProperties() {
    const isBootstrap = this.currentFramework === "bootstrap";
    return `
      <div class="property-group">
        <h4>Position & Layout</h4>
        ${this.createSelectProperty(
          "position",
          "Position Type",
          isBootstrap
            ? [
                ["position-static", "Static"],
                ["position-relative", "Relative"],
                ["position-absolute", "Absolute"],
                ["position-fixed", "Fixed"],
              ]
            : [
                ["static", "Static"],
                ["relative", "Relative"],
                ["absolute", "Absolute"],
                ["fixed", "Fixed"],
              ]
        )}
        ${this.createSelectProperty(
          "display",
          "Display",
          isBootstrap
            ? [
                ["d-block", "Block"],
                ["d-inline", "Inline"],
                ["d-flex", "Flex"],
                ["d-grid", "Grid"],
                ["d-none", "Hidden"],
              ]
            : [
                ["block", "Block"],
                ["inline", "Inline"],
                ["flex", "Flex"],
                ["grid", "Grid"],
                ["hidden", "Hidden"],
              ]
        )}
        ${this.createSelectProperty(
          "width",
          "Width",
          isBootstrap
            ? [
                ["w-25", "25%"],
                ["w-50", "50%"],
                ["w-75", "75%"],
                ["w-100", "100%"],
              ]
            : [
                ["w-1/4", "25%"],
                ["w-1/2", "50%"],
                ["w-3/4", "75%"],
                ["w-full", "100%"],
              ]
        )}
      </div>
    `;
  }

  getFlexProperties() {
    const isBootstrap = this.currentFramework === "bootstrap";
    return `
      <div class="property-group">
        <h4>Flex Properties</h4>
        ${this.createSelectProperty(
          "justifyContent",
          "Justify Content",
          isBootstrap
            ? [
                ["justify-content-start", "Start"],
                ["justify-content-center", "Center"],
                ["justify-content-end", "End"],
                ["justify-content-between", "Between"],
              ]
            : [
                ["justify-start", "Start"],
                ["justify-center", "Center"],
                ["justify-end", "End"],
                ["justify-between", "Between"],
              ]
        )}
        ${this.createSelectProperty(
          "alignItems",
          "Align Items",
          isBootstrap
            ? [
                ["align-items-start", "Start"],
                ["align-items-center", "Center"],
                ["align-items-end", "End"],
                ["align-items-stretch", "Stretch"],
              ]
            : [
                ["items-start", "Start"],
                ["items-center", "Center"],
                ["items-end", "End"],
                ["items-stretch", "Stretch"],
              ]
        )}
      </div>
    `;
  }

  createSelectProperty(id, label, options) {
    return `
      <div class="property-item">
        <label>${label}</label>
        <select id="${id}">
          <option value="">Default</option>
          ${options
            .map(([value, text]) => `<option value="${value}">${text}</option>`)
            .join("")}
        </select>
      </div>
    `;
  }

  updateElementProperty(element, input) {
    const property = input.id;
    const value = input.value;

    this.removeExistingClasses(element, property);

    switch (property) {
      case "textContent":
        element.textContent = value;
        break;
      case "imageSrc":
        element.src = value;
        break;
      case "imageAlt":
        element.alt = value;
        break;
      case "headingLevel":
        const newHeading = document.createElement(value);
        newHeading.className = element.className;
        newHeading.textContent = element.textContent;
        newHeading.dataset.elementId = element.dataset.elementId;
        newHeading.dataset.elementType = element.dataset.elementType;

        const controls = element.querySelector(".element-controls");
        if (controls) newHeading.appendChild(controls.cloneNode(true));

        element.parentNode.replaceChild(newHeading, element);
        this.selectedElement = newHeading;
        break;
      default:
        if (value) element.classList.add(value);
        break;
    }

    this.updateGeneratedCode();
  }

  removeExistingClasses(element, propertyType) {
    const classMapping = this.getClassMapping();
    if (classMapping[propertyType]) {
      classMapping[propertyType].forEach((className) =>
        element.classList.remove(className)
      );
    }
  }

  closePropertiesPanel() {
    const panel = document.getElementById("propertiesPanel");
    panel.classList.remove("visible", "open");
    panel.classList.add("hidden");
    this.selectedElement = null;

    document
      .querySelectorAll(".canvas-element.selected")
      .forEach((el) => el.classList.remove("selected"));

    const toggleBtn = document.getElementById("propertiesToggle");
    if (toggleBtn) toggleBtn.classList.remove("active");
  }

  togglePropertiesPanel() {
    const panel = document.getElementById("propertiesPanel");
    const toggleBtn = document.getElementById("propertiesToggle");

    if (
      panel.classList.contains("open") ||
      panel.classList.contains("visible")
    ) {
      this.closePropertiesPanel();
    } else {
      panel.classList.remove("hidden");
      panel.classList.add("open", "visible");
      if (toggleBtn) toggleBtn.classList.add("active");
    }
  }

  changeViewport(viewport) {
    const canvas = document.getElementById("canvas");
    document
      .querySelectorAll(".viewport-btn")
      .forEach((btn) => btn.classList.remove("active"));

    const targetButton = document.querySelector(
      `[data-viewport="${viewport}"]`
    );
    if (targetButton) targetButton.classList.add("active");
    if (canvas) canvas.className = `canvas ${viewport}`;
  }

  clearCanvas() {
    const canvas = document.getElementById("canvas");
    canvas.innerHTML = `
      <div class="drop-zone">
        <div class="drop-zone-content">
          <i class="fas fa-plus-circle"></i>
          <p>Drag components here to start building</p>
        </div>
      </div>
    `;
    canvas.classList.remove("has-content");
    this.canvasElements = [];
    this.closePropertiesPanel();
    this.updateGeneratedCode();
  }

  updateGeneratedCode() {
    const canvas = document.getElementById("canvas");
    const elements = canvas.querySelectorAll(".canvas-element");

    let html = "";
    elements.forEach((element) => {
      html += this.elementToHtml(element) + "\n";
    });

    const storageElement = document.getElementById("generatedCodeStorage");
    if (storageElement) {
      storageElement.textContent =
        html || "<!-- Your generated code will appear here -->";
    }

    const copyBtn = document.getElementById("copyCode");
    if (copyBtn) {
      copyBtn.classList.toggle("diff-valid", !!html.trim());
      copyBtn.classList.toggle("diff-unchanged", !html.trim());
    }
  }

  elementToHtml(element) {
    const clone = element.cloneNode(true);
    const controls = clone.querySelector(".element-controls");
    if (controls) controls.remove();

    clone.removeAttribute("contenteditable");
    clone.removeAttribute("data-element-id");
    clone.removeAttribute("data-element-type");
    clone.classList.remove(
      "canvas-element",
      "selected",
      "diff-new",
      "diff-modified",
      "diff-error"
    );

    const temp = document.createElement("div");
    temp.appendChild(clone);
    return this.formatHtml(temp.innerHTML);
  }

  formatHtml(html) {
    return html
      .replace(/></g, ">\n<")
      .replace(/^\s+|\s+$/g, "")
      .split("\n")
      .map((line) => "  " + line.trim())
      .join("\n");
  }

  copyCode() {
    const storageElement = document.getElementById("generatedCodeStorage");
    const code = storageElement
      ? storageElement.textContent
      : "<!-- No code generated yet -->";

    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById("copyCode");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      btn.style.background = "#10b981";

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = "";
      }, 2000);
    });
  }

  showPreview() {
    const storageElement = document.getElementById("generatedCodeStorage");
    const code = storageElement
      ? storageElement.textContent
      : "<!-- No code generated yet -->";
    const modal = document.getElementById("previewModal");
    const iframe = document.getElementById("previewFrame");

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        ${
          this.currentFramework === "bootstrap"
            ? '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">'
            : '<script src="https://cdn.tailwindcss.com"></script>'
        }
        <style>body { padding: 20px; }</style>
      </head>
      <body>
        ${code}
        ${
          this.currentFramework === "bootstrap"
            ? '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>'
            : ""
        }
      </body>
      </html>
    `;

    iframe.src = "data:text/html;charset=utf-8," + encodeURIComponent(fullHtml);
    modal.classList.add("visible");
  }

  closePreview() {
    document.getElementById("previewModal").classList.remove("visible");
  }

  exportCode() {
    const storageElement = document.getElementById("generatedCodeStorage");
    const code = storageElement
      ? storageElement.textContent
      : "<!-- No code generated yet -->";
    const framework = this.currentFramework;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated ${
      framework.charAt(0).toUpperCase() + framework.slice(1)
    } Code</title>
    ${
      framework === "bootstrap"
        ? '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">'
        : '<script src="https://cdn.tailwindcss.com"></script>'
    }
</head>
<body>
    ${code}
    ${
      framework === "bootstrap"
        ? '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>'
        : ""
    }
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${framework}-generated-code.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  toggleCategory(category) {
    category.classList.toggle("collapsed");
  }

  searchComponents(query) {
    const items = document.querySelectorAll(".component-item");
    const categories = document.querySelectorAll(".category");

    if (!query.trim()) {
      items.forEach((item) => (item.style.display = ""));
      categories.forEach((cat) => (cat.style.display = ""));
      return;
    }

    const searchTerm = query.toLowerCase();

    categories.forEach((category) => {
      const categoryItems = category.querySelectorAll(".component-item");
      let hasVisibleItems = false;

      categoryItems.forEach((item) => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          item.style.display = "";
          hasVisibleItems = true;
        } else {
          item.style.display = "none";
        }
      });

      category.style.display = hasVisibleItems ? "" : "none";
    });
  }
}

// Initialize the generator
let generator;
document.addEventListener("DOMContentLoaded", () => {
  try {
    generator = new BootstrapClassGenerator();
    console.log("Bootstrap Class Generator initialized successfully");
  } catch (error) {
    console.error("Error initializing Bootstrap Class Generator:", error);
  }
});

// Close modal when clicking backdrop
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) {
    document.getElementById("previewModal").classList.remove("visible");
  }
});
