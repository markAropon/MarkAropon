// Database Designer Application
class DatabaseDesigner {
  constructor() {
    this.tables = new Map();
    this.connections = new Map();
    this.selectedTable = null;
    this.connectionMode = false;
    this.zoomLevel = 1;
    this.panOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.connectionStart = null;
    this.tableCounter = 0;
    this.connectionCounter = 0;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.updateCanvasInfo();
  }

  setupEventListeners() {
    // Canvas events
    const canvas = document.getElementById("canvas");
    canvas.addEventListener("mousedown", this.handleCanvasMouseDown.bind(this));
    canvas.addEventListener("mousemove", this.handleCanvasMouseMove.bind(this));
    canvas.addEventListener("mouseup", this.handleCanvasMouseUp.bind(this));
    canvas.addEventListener("wheel", this.handleCanvasWheel.bind(this));

    // Window events
    window.addEventListener("resize", this.handleResize.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));

    // AI Input
    document
      .getElementById("aiInput")
      .addEventListener("keypress", this.handleAIInput.bind(this));
  }

  setupDragAndDrop() {
    const tablesContainer = document.getElementById("tables-container");

    // Data type drag and drop
    document.querySelectorAll(".data-type").forEach((element) => {
      element.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", e.target.dataset.type);
      });
    });

    tablesContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });

    tablesContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      const dataType = e.dataTransfer.getData("text/plain");
      if (dataType) {
        this.handleDataTypeDrop(dataType, e.clientX, e.clientY);
      }
    });
  }

  handleDataTypeDrop(dataType, clientX, clientY) {
    // Convert screen coordinates to canvas coordinates
    const canvasRect = document
      .getElementById("canvas")
      .getBoundingClientRect();
    const x = clientX - canvasRect.left;
    const y = clientY - canvasRect.top;

    // Create a new table at the drop location
    this.addTable(x, y);
  }

  // Table Management
  addTable(x = 100, y = 100) {
    const tableId = `table_${++this.tableCounter}`;
    const tableName = `Table${this.tableCounter}`;

    const table = {
      id: tableId,
      name: tableName,
      x: x,
      y: y,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          defaultValue: "",
          isPrimary: true,
          isAutoIncrement: true,
          comment: "",
        },
      ],
      comment: "",
      engine: "InnoDB",
    };

    this.tables.set(tableId, table);
    this.renderTable(table);
    this.updateCanvasInfo();
    this.selectTable(tableId);
  }

  renderTable(table) {
    const tablesContainer = document.getElementById("tables-container");

    const tableElement = document.createElement("div");
    tableElement.className = "db-table";
    tableElement.id = table.id;
    tableElement.style.left = table.x + "px";
    tableElement.style.top = table.y + "px";
    tableElement.draggable = true;

    tableElement.innerHTML = `
            <div class="table-header">
                <span class="table-name">${table.name}</span>
                <div class="table-actions">
                    <button class="table-action" onclick="dbDesigner.editTable('${
                      table.id
                    }')" title="Edit Table">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action" onclick="dbDesigner.deleteTable('${
                      table.id
                    }')" title="Delete Table">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="table-body">
                ${this.renderTableColumns(table)}
            </div>
        `;

    // Event listeners
    tableElement.addEventListener("click", () => this.selectTable(table.id));
    tableElement.addEventListener(
      "dragstart",
      this.handleTableDragStart.bind(this)
    );
    tableElement.addEventListener("drag", this.handleTableDrag.bind(this));
    tableElement.addEventListener(
      "dragend",
      this.handleTableDragEnd.bind(this)
    );

    // Column connection events
    tableElement.querySelectorAll(".table-column").forEach((column) => {
      column.addEventListener("click", (e) => {
        if (this.connectionMode) {
          e.stopPropagation();
          this.handleColumnConnection(table.id, column.dataset.column);
        }
      });
    });

    tablesContainer.appendChild(tableElement);
  }

  renderTableColumns(table) {
    return table.columns
      .map(
        (column) => `
            <div class="table-column" data-column="${column.name}">
                <div class="column-info">
                    <div class="column-name">${column.name}</div>
                    <div class="column-type">${column.type}${
          column.length ? `(${column.length})` : ""
        }</div>
                </div>
                <div class="column-constraints">
                    ${
                      column.isPrimary
                        ? '<span class="constraint-badge constraint-primary">PK</span>'
                        : ""
                    }
                    ${
                      column.isForeignKey
                        ? '<span class="constraint-badge constraint-foreign">FK</span>'
                        : ""
                    }
                    ${
                      column.isUnique
                        ? '<span class="constraint-badge constraint-unique">UQ</span>'
                        : ""
                    }
                    ${
                      !column.nullable
                        ? '<span class="constraint-badge constraint-null">NOT NULL</span>'
                        : ""
                    }
                </div>
            </div>
        `
      )
      .join("");
  }

  updateTable(tableId) {
    const table = this.tables.get(tableId);
    if (table) {
      const tableElement = document.getElementById(tableId);
      if (tableElement) {
        tableElement.querySelector(".table-name").textContent = table.name;
        tableElement.querySelector(".table-body").innerHTML =
          this.renderTableColumns(table);

        // Re-attach column event listeners
        tableElement.querySelectorAll(".table-column").forEach((column) => {
          column.addEventListener("click", (e) => {
            if (this.connectionMode) {
              e.stopPropagation();
              this.handleColumnConnection(tableId, column.dataset.column);
            }
          });
        });
      }
    }
  }

  selectTable(tableId) {
    // Remove previous selection
    document.querySelectorAll(".db-table").forEach((table) => {
      table.classList.remove("selected");
    });

    // Select new table
    const tableElement = document.getElementById(tableId);
    if (tableElement) {
      tableElement.classList.add("selected");
      this.selectedTable = tableId;
      this.updatePropertiesPanel();
    }
  }

  deleteTable(tableId) {
    if (confirm("Are you sure you want to delete this table?")) {
      // Remove connections involving this table
      this.connections.forEach((connection, id) => {
        if (
          connection.sourceTable === tableId ||
          connection.targetTable === tableId
        ) {
          this.deleteConnection(id);
        }
      });

      // Remove table
      this.tables.delete(tableId);
      const tableElement = document.getElementById(tableId);
      if (tableElement) {
        tableElement.remove();
      }

      if (this.selectedTable === tableId) {
        this.selectedTable = null;
        this.updatePropertiesPanel();
      }

      this.updateCanvasInfo();
    }
  }

  // Connection Management
  toggleConnectionMode() {
    this.connectionMode = !this.connectionMode;
    const button = document.querySelector('[onclick="toggleConnectionMode()"]');

    if (this.connectionMode) {
      button.classList.add("active");
      document.body.classList.add("connection-mode");
      button.innerHTML = '<i class="fas fa-times"></i> Cancel Connection';
    } else {
      button.classList.remove("active");
      document.body.classList.remove("connection-mode");
      button.innerHTML = '<i class="fas fa-bezier-curve"></i> Connect Tables';
      this.connectionStart = null;
    }
  }

  handleColumnConnection(tableId, columnName) {
    if (!this.connectionStart) {
      this.connectionStart = { tableId, columnName };
      this.showConnectionPreview(tableId, columnName);
    } else {
      if (this.connectionStart.tableId !== tableId) {
        this.createConnection(
          this.connectionStart.tableId,
          this.connectionStart.columnName,
          tableId,
          columnName
        );
      }
      this.connectionStart = null;
      this.hideConnectionPreview();
    }
  }

  showConnectionPreview(tableId, columnName) {
    // Visual feedback for connection start
    const tableElement = document.getElementById(tableId);
    if (tableElement) {
      tableElement.classList.add("connection-source");
      const column = tableElement.querySelector(
        `[data-column="${columnName}"]`
      );
      if (column) {
        column.classList.add("connection-source-column");
      }
    }
  }

  hideConnectionPreview() {
    // Remove visual feedback
    document.querySelectorAll(".connection-source").forEach((element) => {
      element.classList.remove("connection-source");
    });
    document
      .querySelectorAll(".connection-source-column")
      .forEach((element) => {
        element.classList.remove("connection-source-column");
      });
  }

  createConnection(sourceTableId, sourceColumn, targetTableId, targetColumn) {
    const connectionId = `conn_${++this.connectionCounter}`;

    const connection = {
      id: connectionId,
      sourceTable: sourceTableId,
      sourceColumn: sourceColumn,
      targetTable: targetTableId,
      targetColumn: targetColumn,
      type: "foreign-key",
    };

    this.connections.set(connectionId, connection);

    // Mark target column as foreign key
    const targetTable = this.tables.get(targetTableId);
    const column = targetTable.columns.find((col) => col.name === targetColumn);
    if (column) {
      column.isForeignKey = true;
    }

    this.renderConnection(connection);
    this.updateTable(targetTableId);
    this.updateCanvasInfo();
  }

  renderConnection(connection) {
    const sourceTable = this.tables.get(connection.sourceTable);
    const targetTable = this.tables.get(connection.targetTable);

    if (!sourceTable || !targetTable) return;

    const canvas = document.getElementById("canvas");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.id = connection.id;
    line.classList.add("connection-line", connection.type);

    this.updateConnectionPosition(connection);

    line.addEventListener("click", () => {
      if (confirm("Delete this connection?")) {
        this.deleteConnection(connection.id);
      }
    });

    canvas.appendChild(line);
  }

  updateConnectionPosition(connection) {
    const sourceElement = document.getElementById(connection.sourceTable);
    const targetElement = document.getElementById(connection.targetTable);
    const line = document.getElementById(connection.id);

    if (!sourceElement || !targetElement || !line) return;

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const canvasRect = document
      .getElementById("canvas")
      .getBoundingClientRect();

    const x1 = sourceRect.right - canvasRect.left;
    const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
    const x2 = targetRect.left - canvasRect.left;
    const y2 = targetRect.top + targetRect.height / 2 - canvasRect.top;

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
  }

  deleteConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Remove foreign key marking
      const targetTable = this.tables.get(connection.targetTable);
      const column = targetTable.columns.find(
        (col) => col.name === connection.targetColumn
      );
      if (column) {
        column.isForeignKey = false;
      }

      this.connections.delete(connectionId);
      const line = document.getElementById(connectionId);
      if (line) {
        line.remove();
      }

      this.updateTable(connection.targetTable);
      this.updateCanvasInfo();
    }
  }

  // Properties Panel
  updatePropertiesPanel() {
    const propertiesContent = document.getElementById("propertiesContent");

    if (!this.selectedTable) {
      propertiesContent.innerHTML = `
                <div class="property-section">
                    <h4>No Table Selected</h4>
                    <p>Select a table to view and edit its properties.</p>
                </div>
            `;
      return;
    }

    const table = this.tables.get(this.selectedTable);
    if (!table) return;

    document.getElementById("tableName").value = table.name;
    document.getElementById("tableComment").value = table.comment;
    document.getElementById("tableEngine").value = table.engine;

    this.updateColumnsList();
  }

  updateColumnsList() {
    const table = this.tables.get(this.selectedTable);
    if (!table) return;

    const columnsList = document.getElementById("columnsList");
    columnsList.innerHTML = table.columns
      .map(
        (column, index) => `
            <div class="column-item" data-index="${index}">
                <div class="column-header">
                    <input type="text" value="${
                      column.name
                    }" onchange="dbDesigner.updateColumnProperty(${index}, 'name', this.value)">
                    <select onchange="dbDesigner.updateColumnProperty(${index}, 'type', this.value)">
                        <option value="INT" ${
                          column.type === "INT" ? "selected" : ""
                        }>INT</option>
                        <option value="VARCHAR" ${
                          column.type === "VARCHAR" ? "selected" : ""
                        }>VARCHAR</option>
                        <option value="TEXT" ${
                          column.type === "TEXT" ? "selected" : ""
                        }>TEXT</option>
                        <option value="DATE" ${
                          column.type === "DATE" ? "selected" : ""
                        }>DATE</option>
                        <option value="BOOLEAN" ${
                          column.type === "BOOLEAN" ? "selected" : ""
                        }>BOOLEAN</option>
                        <option value="DECIMAL" ${
                          column.type === "DECIMAL" ? "selected" : ""
                        }>DECIMAL</option>
                        <option value="TIMESTAMP" ${
                          column.type === "TIMESTAMP" ? "selected" : ""
                        }>TIMESTAMP</option>
                        <option value="JSON" ${
                          column.type === "JSON" ? "selected" : ""
                        }>JSON</option>
                    </select>
                    <button onclick="dbDesigner.deleteColumn(${index})" class="btn-delete-column">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="column-options">
                    <label><input type="checkbox" ${
                      column.isPrimary ? "checked" : ""
                    } onchange="dbDesigner.updateColumnProperty(${index}, 'isPrimary', this.checked)"> Primary Key</label>
                    <label><input type="checkbox" ${
                      !column.nullable ? "checked" : ""
                    } onchange="dbDesigner.updateColumnProperty(${index}, 'nullable', !this.checked)"> Not Null</label>
                    <label><input type="checkbox" ${
                      column.isAutoIncrement ? "checked" : ""
                    } onchange="dbDesigner.updateColumnProperty(${index}, 'isAutoIncrement', this.checked)"> Auto Increment</label>
                    <label><input type="checkbox" ${
                      column.isUnique ? "checked" : ""
                    } onchange="dbDesigner.updateColumnProperty(${index}, 'isUnique', this.checked)"> Unique</label>
                </div>
            </div>
        `
      )
      .join("");
  }

  addColumn() {
    const table = this.tables.get(this.selectedTable);
    if (!table) return;

    table.columns.push({
      name: `column${table.columns.length + 1}`,
      type: "VARCHAR",
      length: "255",
      nullable: true,
      defaultValue: "",
      isPrimary: false,
      isAutoIncrement: false,
      isUnique: false,
      comment: "",
    });

    this.updateTable(this.selectedTable);
    this.updateColumnsList();
  }

  deleteColumn(index) {
    const table = this.tables.get(this.selectedTable);
    if (!table || table.columns.length <= 1) return;

    table.columns.splice(index, 1);
    this.updateTable(this.selectedTable);
    this.updateColumnsList();
  }

  updateColumnProperty(index, property, value) {
    const table = this.tables.get(this.selectedTable);
    if (!table || !table.columns[index]) return;

    table.columns[index][property] = value;
    this.updateTable(this.selectedTable);
  }

  updateTableProperty(property, value) {
    const table = this.tables.get(this.selectedTable);
    if (!table) return;

    table[property] = value;
    this.updateTable(this.selectedTable);
  }

  editTable(tableId) {
    this.selectTable(tableId);
    // You could open a modal here or just use the properties panel
    // For now, we'll just select the table and use the properties panel
    const modal = document.getElementById("tableModal");
    if (modal) {
      modal.classList.add("show");
      this.populateTableEditor(tableId);
    }
  }

  populateTableEditor(tableId) {
    const table = this.tables.get(tableId);
    if (!table) return;

    // Populate the table editor modal with current table data
    // This would fill the columnsGrid in the modal
    const columnsGrid = document.getElementById("columnsGrid");
    if (columnsGrid) {
      // Implementation for populating the table editor
    }
  } // Export Functions
  exportSQL() {
    let sql = "-- Generated SQL Schema\n\n";

    // Create tables
    this.tables.forEach((table) => {
      sql += `CREATE TABLE \`${table.name}\` (\n`;

      const columnDefinitions = table.columns.map((column) => {
        let def = `  \`${column.name}\` ${column.type}`;
        if (column.length) def += `(${column.length})`;
        if (!column.nullable) def += " NOT NULL";
        if (column.isAutoIncrement) def += " AUTO_INCREMENT";
        if (column.defaultValue) def += ` DEFAULT '${column.defaultValue}'`;
        if (column.comment) def += ` COMMENT '${column.comment}'`;
        return def;
      });

      sql += columnDefinitions.join(",\n");

      // Add primary key
      const primaryKeys = table.columns
        .filter((col) => col.isPrimary)
        .map((col) => col.name);
      if (primaryKeys.length > 0) {
        sql += `,\n  PRIMARY KEY (\`${primaryKeys.join("`, `")}\`)`;
      }

      sql += `\n) ENGINE=${table.engine}`;
      if (table.comment) sql += ` COMMENT='${table.comment}'`;
      sql += ";\n\n";
    });

    // Add foreign key constraints
    this.connections.forEach((connection) => {
      const sourceTable = this.tables.get(connection.sourceTable);
      const targetTable = this.tables.get(connection.targetTable);

      sql += `ALTER TABLE \`${targetTable.name}\` ADD CONSTRAINT \`fk_${targetTable.name}_${connection.targetColumn}\` `;
      sql += `FOREIGN KEY (\`${connection.targetColumn}\`) REFERENCES \`${sourceTable.name}\`(\`${connection.sourceColumn}\`);\n`;
    });

    this.downloadFile("schema.sql", sql, "text/sql");
  }

  exportJSON() {
    const schema = {
      tables: Array.from(this.tables.values()),
      connections: Array.from(this.connections.values()),
      metadata: {
        created: new Date().toISOString(),
        version: "1.0",
      },
    };

    this.downloadFile(
      "schema.json",
      JSON.stringify(schema, null, 2),
      "application/json"
    );
  }

  exportXML() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<database>\n';

    this.tables.forEach((table) => {
      xml += `  <table name="${table.name}" engine="${table.engine}">\n`;
      if (table.comment) xml += `    <comment>${table.comment}</comment>\n`;

      table.columns.forEach((column) => {
        xml += `    <column name="${column.name}" type="${column.type}"`;
        if (column.length) xml += ` length="${column.length}"`;
        xml += ` nullable="${column.nullable}"`;
        xml += ` primary="${column.isPrimary}"`;
        xml += ` autoIncrement="${column.isAutoIncrement}"`;
        xml += ` unique="${column.isUnique}"`;
        if (column.defaultValue) xml += ` default="${column.defaultValue}"`;
        if (column.comment) xml += ` comment="${column.comment}"`;
        xml += "/>\n";
      });

      xml += "  </table>\n";
    });

    this.connections.forEach((connection) => {
      xml += `  <foreignKey source="${connection.sourceTable}.${connection.sourceColumn}" target="${connection.targetTable}.${connection.targetColumn}"/>\n`;
    });

    xml += "</database>";
    this.downloadFile("schema.xml", xml, "application/xml");
  }

  exportPDF() {
    // This would require a PDF library like jsPDF
    alert(
      "PDF export functionality would be implemented with a library like jsPDF"
    );
  }

  exportPNG() {
    // This would require converting the SVG canvas to PNG
    alert(
      "PNG export functionality would be implemented using canvas conversion"
    );
  }

  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Query Generation
  generateSelect() {
    if (!this.selectedTable) return;

    const table = this.tables.get(this.selectedTable);
    const columns = table.columns.map((col) => col.name).join(", ");
    const query = `SELECT ${columns}\nFROM ${table.name};`;

    document.getElementById("generatedQuery").value = query;
  }

  generateInsert() {
    if (!this.selectedTable) return;

    const table = this.tables.get(this.selectedTable);
    const columns = table.columns
      .filter((col) => !col.isAutoIncrement)
      .map((col) => col.name);
    const values = columns.map(() => "?").join(", ");
    const query = `INSERT INTO ${table.name} (${columns.join(
      ", "
    )})\nVALUES (${values});`;

    document.getElementById("generatedQuery").value = query;
  }

  generateUpdate() {
    if (!this.selectedTable) return;

    const table = this.tables.get(this.selectedTable);
    const primaryKey = table.columns.find((col) => col.isPrimary);
    const updateColumns = table.columns.filter(
      (col) => !col.isPrimary && !col.isAutoIncrement
    );
    const setClause = updateColumns
      .map((col) => `${col.name} = ?`)
      .join(",\n    ");
    const query = `UPDATE ${table.name}\nSET ${setClause}\nWHERE ${
      primaryKey?.name || "id"
    } = ?;`;

    document.getElementById("generatedQuery").value = query;
  }

  generateDelete() {
    if (!this.selectedTable) return;

    const table = this.tables.get(this.selectedTable);
    const primaryKey = table.columns.find((col) => col.isPrimary);
    const query = `DELETE FROM ${table.name}\nWHERE ${
      primaryKey?.name || "id"
    } = ?;`;

    document.getElementById("generatedQuery").value = query;
  }

  generateJoin() {
    const tables = Array.from(this.tables.values());
    if (tables.length < 2) return;

    let query = `SELECT t1.*, t2.*\nFROM ${tables[0].name} t1\nJOIN ${tables[1].name} t2 ON t1.id = t2.${tables[0].name}_id;`;
    document.getElementById("generatedQuery").value = query;
  }

  generateUnion() {
    const tables = Array.from(this.tables.values());
    if (tables.length < 2) return;

    const commonColumns = tables[0].columns.map((col) => col.name).join(", ");
    let query = `SELECT ${commonColumns}\nFROM ${tables[0].name}\nUNION\nSELECT ${commonColumns}\nFROM ${tables[1].name};`;
    document.getElementById("generatedQuery").value = query;
  }

  // AI Assistant
  async sendAIMessage(message) {
    if (!message) {
      message = document.getElementById("aiInput").value.trim();
    }

    if (!message) return;

    this.addAIMessage(message, "user");
    document.getElementById("aiInput").value = "";

    // Simulate AI response
    setTimeout(() => {
      const response = this.generateAIResponse(message);
      this.addAIMessage(response, "ai");
    }, 1000);
  }

  addAIMessage(message, sender) {
    const chatHistory = document.getElementById("chatHistory");
    const messageDiv = document.createElement("div");
    messageDiv.className = `${sender}-message`;

    const icon =
      sender === "ai"
        ? '<i class="fas fa-robot"></i>'
        : '<i class="fas fa-user"></i>';
    messageDiv.innerHTML = `
            ${icon}
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;

    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("table") && lowerMessage.includes("create")) {
      return "I can help you create a table! What kind of data will this table store? For example, if it's for users, I'd suggest columns like id (primary key), name, email, and created_at.";
    } else if (
      lowerMessage.includes("relationship") ||
      lowerMessage.includes("foreign key")
    ) {
      return "To create relationships between tables, use the 'Connect Tables' mode and click on columns to link them. I recommend using descriptive foreign key names like 'user_id' or 'category_id'.";
    } else if (lowerMessage.includes("optimize")) {
      return "Here are some optimization tips: 1) Add indexes on frequently queried columns, 2) Use appropriate data types (INT vs BIGINT), 3) Normalize your tables to reduce redundancy, 4) Consider partitioning for large tables.";
    } else if (lowerMessage.includes("index")) {
      return "Indexes improve query performance. Add them on: 1) Primary keys (automatic), 2) Foreign keys, 3) Columns used in WHERE clauses, 4) Columns used in ORDER BY. But avoid over-indexing as it slows down INSERT/UPDATE operations.";
    } else {
      return "I'm here to help with database design! I can assist with creating tables, optimizing relationships, generating SQL queries, and suggesting best practices. What specific aspect would you like help with?";
    }
  }

  // Template Loading
  loadTemplate(templateName) {
    this.clearCanvas();

    switch (templateName) {
      case "blog":
        this.loadBlogTemplate();
        break;
      case "ecommerce":
        this.loadEcommerceTemplate();
        break;
      case "crm":
        this.loadCRMTemplate();
        break;
      case "hr":
        this.loadHRTemplate();
        break;
    }
  }

  loadBlogTemplate() {
    // Users table
    const usersTable = {
      id: "table_1",
      name: "users",
      x: 100,
      y: 100,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        {
          name: "username",
          type: "VARCHAR",
          length: "50",
          nullable: false,
          isUnique: true,
        },
        {
          name: "email",
          type: "VARCHAR",
          length: "100",
          nullable: false,
          isUnique: true,
        },
        {
          name: "password_hash",
          type: "VARCHAR",
          length: "255",
          nullable: false,
        },
        { name: "created_at", type: "TIMESTAMP", nullable: false },
      ],
    };

    // Posts table
    const postsTable = {
      id: "table_2",
      name: "posts",
      x: 400,
      y: 100,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        { name: "title", type: "VARCHAR", length: "200", nullable: false },
        { name: "content", type: "TEXT", nullable: false },
        { name: "author_id", type: "INT", nullable: false, isForeignKey: true },
        { name: "created_at", type: "TIMESTAMP", nullable: false },
        { name: "updated_at", type: "TIMESTAMP", nullable: true },
      ],
    };

    // Categories table
    const categoriesTable = {
      id: "table_3",
      name: "categories",
      x: 100,
      y: 350,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        {
          name: "name",
          type: "VARCHAR",
          length: "100",
          nullable: false,
          isUnique: true,
        },
        { name: "description", type: "TEXT", nullable: true },
      ],
    };

    this.tables.set("table_1", usersTable);
    this.tables.set("table_2", postsTable);
    this.tables.set("table_3", categoriesTable);

    this.renderTable(usersTable);
    this.renderTable(postsTable);
    this.renderTable(categoriesTable);

    // Create relationships
    this.createConnection("table_1", "id", "table_2", "author_id");

    this.tableCounter = 3;
    this.updateCanvasInfo();
  }

  loadEcommerceTemplate() {
    // Products table
    const productsTable = {
      id: "table_1",
      name: "products",
      x: 100,
      y: 100,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        { name: "name", type: "VARCHAR", length: "200", nullable: false },
        { name: "description", type: "TEXT", nullable: true },
        { name: "price", type: "DECIMAL", length: "10,2", nullable: false },
        {
          name: "category_id",
          type: "INT",
          nullable: false,
          isForeignKey: true,
        },
        {
          name: "stock_quantity",
          type: "INT",
          nullable: false,
          defaultValue: "0",
        },
        { name: "created_at", type: "TIMESTAMP", nullable: false },
      ],
    };

    // Categories table
    const categoriesTable = {
      id: "table_2",
      name: "categories",
      x: 400,
      y: 100,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        {
          name: "name",
          type: "VARCHAR",
          length: "100",
          nullable: false,
          isUnique: true,
        },
        { name: "description", type: "TEXT", nullable: true },
      ],
    };

    // Orders table
    const ordersTable = {
      id: "table_3",
      name: "orders",
      x: 100,
      y: 350,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        { name: "user_id", type: "INT", nullable: false, isForeignKey: true },
        {
          name: "total_amount",
          type: "DECIMAL",
          length: "10,2",
          nullable: false,
        },
        {
          name: "status",
          type: "VARCHAR",
          length: "50",
          nullable: false,
          defaultValue: "pending",
        },
        { name: "created_at", type: "TIMESTAMP", nullable: false },
      ],
    };

    this.tables.set("table_1", productsTable);
    this.tables.set("table_2", categoriesTable);
    this.tables.set("table_3", ordersTable);

    this.renderTable(productsTable);
    this.renderTable(categoriesTable);
    this.renderTable(ordersTable);

    this.createConnection("table_2", "id", "table_1", "category_id");

    this.tableCounter = 3;
    this.updateCanvasInfo();
  }

  loadCRMTemplate() {
    // Customers table
    const customersTable = {
      id: "table_1",
      name: "customers",
      x: 100,
      y: 100,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        {
          name: "company_name",
          type: "VARCHAR",
          length: "200",
          nullable: false,
        },
        {
          name: "contact_person",
          type: "VARCHAR",
          length: "100",
          nullable: false,
        },
        { name: "email", type: "VARCHAR", length: "100", nullable: false },
        { name: "phone", type: "VARCHAR", length: "20", nullable: true },
        { name: "address", type: "TEXT", nullable: true },
        { name: "created_at", type: "TIMESTAMP", nullable: false },
      ],
    };

    // Deals table
    const dealsTable = {
      id: "table_2",
      name: "deals",
      x: 400,
      y: 100,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        {
          name: "customer_id",
          type: "INT",
          nullable: false,
          isForeignKey: true,
        },
        { name: "title", type: "VARCHAR", length: "200", nullable: false },
        { name: "value", type: "DECIMAL", length: "12,2", nullable: false },
        { name: "stage", type: "VARCHAR", length: "50", nullable: false },
        {
          name: "probability",
          type: "INT",
          nullable: false,
          defaultValue: "0",
        },
        { name: "expected_close_date", type: "DATE", nullable: true },
        { name: "created_at", type: "TIMESTAMP", nullable: false },
      ],
    };

    this.tables.set("table_1", customersTable);
    this.tables.set("table_2", dealsTable);

    this.renderTable(customersTable);
    this.renderTable(dealsTable);

    this.createConnection("table_1", "id", "table_2", "customer_id");

    this.tableCounter = 2;
    this.updateCanvasInfo();
  }

  loadHRTemplate() {
    // Employees table
    const employeesTable = {
      id: "table_1",
      name: "employees",
      x: 100,
      y: 100,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        {
          name: "employee_id",
          type: "VARCHAR",
          length: "20",
          nullable: false,
          isUnique: true,
        },
        { name: "first_name", type: "VARCHAR", length: "50", nullable: false },
        { name: "last_name", type: "VARCHAR", length: "50", nullable: false },
        {
          name: "email",
          type: "VARCHAR",
          length: "100",
          nullable: false,
          isUnique: true,
        },
        {
          name: "department_id",
          type: "INT",
          nullable: false,
          isForeignKey: true,
        },
        { name: "position", type: "VARCHAR", length: "100", nullable: false },
        { name: "salary", type: "DECIMAL", length: "10,2", nullable: false },
        { name: "hire_date", type: "DATE", nullable: false },
        { name: "created_at", type: "TIMESTAMP", nullable: false },
      ],
    };

    // Departments table
    const departmentsTable = {
      id: "table_2",
      name: "departments",
      x: 400,
      y: 100,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        {
          name: "name",
          type: "VARCHAR",
          length: "100",
          nullable: false,
          isUnique: true,
        },
        { name: "description", type: "TEXT", nullable: true },
        { name: "manager_id", type: "INT", nullable: true, isForeignKey: true },
      ],
    };

    // Attendance table
    const attendanceTable = {
      id: "table_3",
      name: "attendance",
      x: 100,
      y: 350,
      columns: [
        {
          name: "id",
          type: "INT",
          length: "",
          nullable: false,
          isPrimary: true,
          isAutoIncrement: true,
        },
        {
          name: "employee_id",
          type: "INT",
          nullable: false,
          isForeignKey: true,
        },
        { name: "check_in", type: "TIMESTAMP", nullable: false },
        { name: "check_out", type: "TIMESTAMP", nullable: true },
        { name: "date", type: "DATE", nullable: false },
        {
          name: "hours_worked",
          type: "DECIMAL",
          length: "4,2",
          nullable: true,
        },
      ],
    };

    this.tables.set("table_1", employeesTable);
    this.tables.set("table_2", departmentsTable);
    this.tables.set("table_3", attendanceTable);

    this.renderTable(employeesTable);
    this.renderTable(departmentsTable);
    this.renderTable(attendanceTable);

    this.createConnection("table_2", "id", "table_1", "department_id");
    this.createConnection("table_1", "id", "table_3", "employee_id");
    this.createConnection("table_1", "id", "table_2", "manager_id");

    this.tableCounter = 3;
    this.updateCanvasInfo();
  }

  // Utility Functions
  updateCanvasInfo() {
    const info = document.getElementById("canvasInfo");
    info.textContent = `Tables: ${this.tables.size} | Relationships: ${this.connections.size}`;
  }

  clearCanvas() {
    this.tables.clear();
    this.connections.clear();
    document.getElementById("tables-container").innerHTML = "";
    document
      .querySelectorAll(".connection-line")
      .forEach((line) => line.remove());
    this.selectedTable = null;
    this.updatePropertiesPanel();
    this.updateCanvasInfo();
  }

  // Event Handlers
  handleTableDragStart(e) {
    this.isDragging = true;
    this.dragStartPos = { x: e.clientX, y: e.clientY };
  }

  handleTableDrag(e) {
    if (!this.isDragging) return;

    const tableId = e.target.closest(".db-table").id;
    const table = this.tables.get(tableId);

    if (table) {
      const deltaX = e.clientX - this.dragStartPos.x;
      const deltaY = e.clientY - this.dragStartPos.y;

      table.x += deltaX;
      table.y += deltaY;

      e.target.style.left = table.x + "px";
      e.target.style.top = table.y + "px";

      this.dragStartPos = { x: e.clientX, y: e.clientY };

      // Update connection positions
      this.connections.forEach((connection) => {
        if (
          connection.sourceTable === tableId ||
          connection.targetTable === tableId
        ) {
          this.updateConnectionPosition(connection);
        }
      });
    }
  }

  handleTableDragEnd(e) {
    this.isDragging = false;
  }

  handleCanvasMouseDown(e) {
    // Handle canvas panning
  }

  handleCanvasMouseMove(e) {
    // Handle canvas panning
  }

  handleCanvasMouseUp(e) {
    // Handle canvas panning
  }

  handleCanvasWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoomLevel *= delta;
    this.zoomLevel = Math.max(0.1, Math.min(3, this.zoomLevel));

    document.getElementById("zoomLevel").textContent =
      Math.round(this.zoomLevel * 100) + "%";

    const canvas = document.getElementById("canvas");
    canvas.style.transform = `scale(${this.zoomLevel})`;
  }

  handleResize() {
    // Update canvas size and redraw connections
    this.connections.forEach((connection) => {
      this.updateConnectionPosition(connection);
    });
  }

  handleKeyDown(e) {
    if (e.key === "Delete" && this.selectedTable) {
      this.deleteTable(this.selectedTable);
    }
  }

  handleAIInput(e) {
    if (e.key === "Enter") {
      this.sendAIMessage();
    }
  }
}

// Global functions for HTML onclick handlers
let dbDesigner;

function toggleExportMenu() {
  const menu = document.getElementById("exportMenu");
  menu.classList.toggle("show");
}

function exportSQL() {
  dbDesigner.exportSQL();
  toggleExportMenu();
}

function exportJSON() {
  dbDesigner.exportJSON();
  toggleExportMenu();
}

function exportXML() {
  dbDesigner.exportXML();
  toggleExportMenu();
}

function exportPDF() {
  dbDesigner.exportPDF();
  toggleExportMenu();
}

function exportPNG() {
  dbDesigner.exportPNG();
  toggleExportMenu();
}

function addTable() {
  dbDesigner.addTable();
}

function addView() {
  // Implementation for adding views
  alert("View creation feature coming soon!");
}

function addIndex() {
  // Implementation for adding indexes
  alert("Index creation feature coming soon!");
}

function clearCanvas() {
  if (confirm("Are you sure you want to clear all tables and connections?")) {
    dbDesigner.clearCanvas();
  }
}

function toggleConnectionMode() {
  dbDesigner.toggleConnectionMode();
}

function autoLayout() {
  // Implementation for auto-layout
  alert("Auto-layout feature coming soon!");
}

function saveProject() {
  const projectData = {
    tables: Array.from(dbDesigner.tables.entries()),
    connections: Array.from(dbDesigner.connections.entries()),
    metadata: {
      saved: new Date().toISOString(),
      version: "1.0",
    },
  };

  localStorage.setItem("dbDesignerProject", JSON.stringify(projectData));
  alert("Project saved successfully!");
}

function loadProject() {
  const saved = localStorage.getItem("dbDesignerProject");
  if (saved) {
    const projectData = JSON.parse(saved);
    dbDesigner.clearCanvas();

    // Restore tables
    projectData.tables.forEach(([id, table]) => {
      dbDesigner.tables.set(id, table);
      dbDesigner.renderTable(table);
    });

    // Restore connections
    projectData.connections.forEach(([id, connection]) => {
      dbDesigner.connections.set(id, connection);
      dbDesigner.renderConnection(connection);
    });

    dbDesigner.updateCanvasInfo();
    alert("Project loaded successfully!");
  } else {
    alert("No saved project found!");
  }
}

function openAIAssistant() {
  const modal = document.getElementById("aiModal");
  modal.classList.add("show");
}

function closeAIAssistant() {
  const modal = document.getElementById("aiModal");
  modal.classList.remove("show");
}

function sendAIMessage() {
  dbDesigner.sendAIMessage();
}

function handleAIInput(e) {
  if (e.key === "Enter") {
    dbDesigner.sendAIMessage();
  }
}

function aiSuggestSchema() {
  const input = prompt("What kind of application are you building?");
  if (input) {
    dbDesigner.sendAIMessage(`Suggest a database schema for: ${input}`);
  }
}

function aiOptimizeStructure() {
  dbDesigner.sendAIMessage("How can I optimize my current database structure?");
}

function aiGenerateData() {
  dbDesigner.sendAIMessage("Generate sample data for my tables");
}

function aiCreateIndexes() {
  dbDesigner.sendAIMessage(
    "What indexes should I create for better performance?"
  );
}

function editTable(tableId) {
  dbDesigner.editTable(tableId);
}

function addColumn() {
  dbDesigner.addColumn();
}

function addTableIndex() {
  if (dbDesigner.selectedTable) {
    alert("Index creation feature coming soon!");
  } else {
    alert("Please select a table first");
  }
}

function togglePropertiesPanel() {
  const panel = document.querySelector(".properties-panel");
  const toggleBtn = document.querySelector(".toggle-btn i");

  if (panel.classList.contains("collapsed")) {
    panel.classList.remove("collapsed");
    toggleBtn.className = "fas fa-chevron-right";
  } else {
    panel.classList.add("collapsed");
    toggleBtn.className = "fas fa-chevron-left";
  }
}

function closeTableModal() {
  const modal = document.getElementById("tableModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

function addColumnToEditor() {
  alert("Add column to editor feature coming soon!");
}

function deleteSelectedColumns() {
  alert("Delete selected columns feature coming soon!");
}

function moveColumnUp() {
  alert("Move column up feature coming soon!");
}

function moveColumnDown() {
  alert("Move column down feature coming soon!");
}

function loadTemplate(templateName) {
  dbDesigner.loadTemplate(templateName);
}

function zoomIn() {
  dbDesigner.zoomLevel *= 1.1;
  dbDesigner.zoomLevel = Math.min(3, dbDesigner.zoomLevel);
  document.getElementById("zoomLevel").textContent =
    Math.round(dbDesigner.zoomLevel * 100) + "%";
  document.getElementById(
    "canvas"
  ).style.transform = `scale(${dbDesigner.zoomLevel})`;
}

function zoomOut() {
  dbDesigner.zoomLevel *= 0.9;
  dbDesigner.zoomLevel = Math.max(0.1, dbDesigner.zoomLevel);
  document.getElementById("zoomLevel").textContent =
    Math.round(dbDesigner.zoomLevel * 100) + "%";
  document.getElementById(
    "canvas"
  ).style.transform = `scale(${dbDesigner.zoomLevel})`;
}

function resetZoom() {
  dbDesigner.zoomLevel = 1;
  document.getElementById("zoomLevel").textContent = "100%";
  document.getElementById("canvas").style.transform = "scale(1)";
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  dbDesigner = new DatabaseDesigner();

  // Close export menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".export-dropdown")) {
      document.getElementById("exportMenu").classList.remove("show");
    }
  });

  // Table property updates
  document.getElementById("tableName").addEventListener("input", (e) => {
    dbDesigner.updateTableProperty("name", e.target.value);
  });

  document.getElementById("tableComment").addEventListener("input", (e) => {
    dbDesigner.updateTableProperty("comment", e.target.value);
  });

  document.getElementById("tableEngine").addEventListener("change", (e) => {
    dbDesigner.updateTableProperty("engine", e.target.value);
  });
});
