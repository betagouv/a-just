#!/usr/bin/env node

/**
 * Generate a Mermaid entity-relationship diagram from Sequelize model
 * definitions in api/src/models/definitions.
 *
 * Does not connect to the database: the definition files are the source of
 * truth for tables, columns, and associations.
 *
 * Usage: npm run db:erd
 */

const fs = require("fs");
const path = require("path");

const DEFINITIONS_DIR = path.resolve(
  __dirname,
  "../api/src/models/definitions",
);
const OUTPUT_PATH = path.resolve(__dirname, "../docs/database-erd.mmd");

const MERMAID_RESERVED = new Set([
  "end",
  "graph",
  "flowchart",
  "subgraph",
  "class",
  "classDef",
  "click",
  "style",
  "linkStyle",
  "group",
  "order",
  "type",
]);

const TYPE_MAP = {
  INTEGER: "int",
  BIGINT: "bigint",
  STRING: "string",
  TEXT: "text",
  DATE: "datetime",
  DATEONLY: "date",
  BOOLEAN: "boolean",
  FLOAT: "float",
  DOUBLE: "double",
  DECIMAL: "decimal",
  JSON: "json",
  JSONB: "jsonb",
  UUID: "uuid",
  ENUM: "enum",
  ARRAY: "array",
};

const RELATION_PRIORITY = {
  HasMany: 3,
  BelongsToMany: 3,
  HasOne: 2,
  BelongsTo: 1,
};

// Used when a column looks like a foreign key but no Sequelize association exists.
const COLUMN_TO_TABLE = {
  user_id: "Users",
  to_user_id: "Users",
  human_id: "HumanResources",
  hr_id: "HumanResources",
  rh_id: "HumanResources",
  hr_backup_id: "HRBackups",
  news_id: "News",
  category_id: "HRCategories",
  fonction_id: "HRFonctions",
  contentieux_id: "ContentieuxReferentiels",
  nac_id: "ContentieuxReferentiels",
  activity_id: "Activities",
  hr_situation_id: "HRSituations",
  option_backup_id: "OptionsBackups",
  hr_backup_group_id: "HRBackupsGroups",
};

function extractBalanced(source, startIdx, openChar, closeChar) {
  let i = startIdx;
  while (i < source.length && source[i] !== openChar) {
    i += 1;
  }
  if (i >= source.length) {
    return null;
  }

  let depth = 0;
  let inString = null;
  let escaped = false;
  const start = i;

  for (; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === openChar) {
      depth += 1;
    } else if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return {
          start,
          end: i,
          content: source.slice(start + 1, i),
        };
      }
    }
  }

  return null;
}

function skipWhitespace(source, index) {
  while (index < source.length && /\s/.test(source[index])) {
    index += 1;
  }
  return index;
}

function parseDefineCall(source, fileName) {
  const defineIdx = source.indexOf(".define(");
  if (defineIdx === -1) {
    throw new Error(`No sequelize.define() found in ${fileName}`);
  }

  let i = skipWhitespace(source, defineIdx + ".define(".length);
  let tableName = null;

  if (source[i] === "'" || source[i] === '"') {
    const quote = source[i];
    const end = source.indexOf(quote, i + 1);
    tableName = source.slice(i + 1, end);
    i = end + 1;
  } else {
    const match = source.slice(i).match(/^([A-Za-z_][\w]*)/);
    if (!match) {
      throw new Error(`Could not parse model name in ${fileName}`);
    }
    i += match[1].length;
    const constMatch = source.match(
      /const\s+tableName\s*=\s*['"]([^'"]+)['"]/,
    );
    tableName = constMatch ? constMatch[1] : match[1];
  }

  i = skipWhitespace(source, i);
  if (source[i] === ",") {
    i += 1;
  }

  const attributes = extractBalanced(source, i, "{", "}");
  if (!attributes) {
    throw new Error(`Could not parse attributes in ${fileName}`);
  }

  return { tableName, attributesBody: attributes.content };
}

function mapSequelizeType(typeName, typeArgs) {
  const upper = typeName.toUpperCase();

  if (upper === "ARRAY") {
    const inner = (typeArgs || "").match(/Sequelize\.([A-Z]+)/i);
    const innerType = inner ? mapSequelizeType(inner[1], "") : "unknown";
    return `${innerType}_array`;
  }

  return TYPE_MAP[upper] || typeName.toLowerCase();
}

function parseFields(attributesBody) {
  const fields = [];
  const fieldStart = /(\w+)\s*:\s*\{/g;
  let match;

  while ((match = fieldStart.exec(attributesBody))) {
    const name = match[1];
    const body = extractBalanced(
      attributesBody,
      match.index + match[0].length - 1,
      "{",
      "}",
    );
    if (!body) {
      continue;
    }

    const typeMatch = body.content.match(
      /type\s*:\s*Sequelize\.([A-Za-z]+)(?:\(([\s\S]*?)\))?/,
    );
    const type = typeMatch
      ? mapSequelizeType(typeMatch[1], typeMatch[2] || "")
      : "unknown";

    fields.push({
      name,
      type,
      primaryKey: /primaryKey\s*:\s*true/.test(body.content),
      unique: /unique\s*:\s*true/.test(body.content),
    });

    fieldStart.lastIndex = body.end + 1;
  }

  return fields;
}

function parseOptionValue(options, key) {
  const match = options.match(new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`));
  return match ? match[1] : null;
}

function parseAssociations(source, sourceTable) {
  const associations = [];
  const assocRe =
    /Model\.(hasOne|hasMany|belongsTo|belongsToMany)\(\s*models\.(\w+)\s*,\s*\{([\s\S]*?)\}/g;
  let match;

  while ((match = assocRe.exec(source))) {
    const associationType = match[1];
    const target = match[2];
    const options = match[3];
    const foreignKey = parseOptionValue(options, "foreignKey");
    const sourceKey = parseOptionValue(options, "sourceKey") || "id";
    const alias = parseOptionValue(options, "as");
    const sourceHoldsFk = sourceKey !== "id" && foreignKey === "id";

    associations.push({
      associationType:
        associationType.charAt(0).toUpperCase() + associationType.slice(1),
      source: sourceTable,
      target,
      foreignKey,
      sourceKey,
      alias,
      sourceHoldsFk,
      fkColumn: sourceHoldsFk ? sourceKey : foreignKey,
    });
  }

  return associations;
}

function parseModelFile(filePath, fileName) {
  const source = fs.readFileSync(filePath, "utf8");
  const { tableName, attributesBody } = parseDefineCall(source, fileName);
  const fields = parseFields(attributesBody);
  const associations = parseAssociations(source, tableName);

  if (!fields.length) {
    throw new Error(`No columns parsed from ${fileName}`);
  }

  return { fileName, tableName, fields, associations };
}

function mermaidName(name) {
  if (MERMAID_RESERVED.has(name) || !/^[A-Za-z_][\w]*$/.test(name)) {
    return `"${name}"`;
  }
  return name;
}

function mermaidRelation(association) {
  switch (association.associationType) {
    case "HasMany":
      return "||--o{";
    case "BelongsToMany":
      return "}o--o{";
    case "BelongsTo":
      return "}o--||";
    case "HasOne":
      return association.sourceHoldsFk ? "}o--||" : "||--o|";
    default:
      return null;
  }
}

function relationDedupeKey(association) {
  const [left, right] = [association.source, association.target].sort();
  return `${left}::${right}::${association.fkColumn || association.alias || ""}`;
}

function collectForeignKeys(models) {
  const fks = new Map();

  const add = (table, column) => {
    if (!table || !column) {
      return;
    }
    if (!fks.has(table)) {
      fks.set(table, new Set());
    }
    fks.get(table).add(column);
  };

  for (const model of models) {
    for (const association of model.associations) {
      if (association.sourceHoldsFk) {
        add(association.source, association.sourceKey);
      } else {
        add(association.target, association.foreignKey);
      }
    }
  }

  return fks;
}

function addInferredAssociations(models) {
  const tableNames = new Set(models.map((model) => model.tableName));
  const existing = new Set(
    models.flatMap((model) =>
      model.associations.map((association) => relationDedupeKey(association)),
    ),
  );

  for (const model of models) {
    for (const field of model.fields) {
      const target = COLUMN_TO_TABLE[field.name];
      if (!target || target === model.tableName || !tableNames.has(target)) {
        continue;
      }

      const inferred = {
        associationType: "BelongsTo",
        source: model.tableName,
        target,
        foreignKey: field.name,
        sourceKey: field.name,
        alias: null,
        sourceHoldsFk: true,
        fkColumn: field.name,
        inferred: true,
      };

      const key = relationDedupeKey(inferred);
      if (existing.has(key)) {
        continue;
      }

      existing.add(key);
      model.associations.push(inferred);
    }
  }
}

function uniqueRelations(models) {
  const byKey = new Map();

  for (const model of models) {
    for (const association of model.associations) {
      if (association.source === association.target) {
        continue;
      }

      const key = relationDedupeKey(association);
      const existing = byKey.get(key);
      const priority = RELATION_PRIORITY[association.associationType] || 0;

      if (!existing || priority > existing.priority) {
        byKey.set(key, { association, priority });
      }
    }
  }

  return [...byKey.values()].map((entry) => entry.association);
}

function buildMermaid(models) {
  const foreignKeys = collectForeignKeys(models);
  const lines = ["%% A-JUST Sequelize models", "erDiagram"];

  const sortedModels = [...models].sort((a, b) =>
    a.tableName.localeCompare(b.tableName),
  );

  for (const model of sortedModels) {
    const tableFks = foreignKeys.get(model.tableName) || new Set();
    lines.push(`  ${mermaidName(model.tableName)} {`);

    for (const field of model.fields) {
      const flags = [];
      if (field.primaryKey) {
        flags.push("PK");
      }
      if (tableFks.has(field.name)) {
        flags.push("FK");
      }
      if (field.unique && !field.primaryKey) {
        flags.push("UK");
      }

      const flagSuffix = flags.length ? ` ${flags.join(", ")}` : "";
      lines.push(
        `    ${field.type} ${mermaidName(field.name)}${flagSuffix}`,
      );
    }

    lines.push("  }");
  }

  const relations = uniqueRelations(models).sort((a, b) => {
    const left = `${a.source}.${a.target}`.localeCompare(
      `${b.source}.${b.target}`,
    );
    if (left !== 0) {
      return left;
    }
    return (a.fkColumn || "").localeCompare(b.fkColumn || "");
  });

  for (const association of relations) {
    const symbol = mermaidRelation(association);
    if (!symbol) {
      continue;
    }

    const label = association.fkColumn || association.alias || association.associationType;
    lines.push(
      `  ${mermaidName(association.source)} ${symbol} ${mermaidName(association.target)} : "${label}"`,
    );
  }

  return `${lines.join("\n")}\n`;
}

function generateERD() {
  if (!fs.existsSync(DEFINITIONS_DIR)) {
    throw new Error(`Model definitions not found: ${DEFINITIONS_DIR}`);
  }

  const files = fs
    .readdirSync(DEFINITIONS_DIR)
    .filter((file) => file.endsWith(".js"))
    .sort();

  const models = files.map((file) =>
    parseModelFile(path.join(DEFINITIONS_DIR, file), file),
  );
  addInferredAssociations(models);
  const mermaid = buildMermaid(models);
  const relationCount = uniqueRelations(models).length;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, mermaid);

  console.log(`ERD generated: ${OUTPUT_PATH}`);
  console.log(
    `Parsed ${models.length} tables and ${relationCount} relationships from Sequelize definitions.`,
  );
}

generateERD();
