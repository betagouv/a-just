#!/usr/bin/env node

/**
 * Sequelize -> Mermaid ERD generator
 *
 * Features:
 * - Sequelize v6 / v7-friendly runtime inspection
 * - No extra npm dependency required
 * - CommonJS or ESM model entry point
 * - PK / FK / UNIQUE indicators
 * - Nullable FK cardinality
 * - HasOne / HasMany / BelongsTo / BelongsToMany
 * - Deduplicates inverse associations
 * - Optional expansion of junction/through tables
 * - Composite keys
 * - Custom field names
 * - Schemas / table names
 * - Self-referencing associations
 * - Multiple associations between the same models
 * - Markdown or raw Mermaid output
 * - CLI configuration
 *
 * Examples:
 *
 *   node scripts/generate-erd.js --module ./src/models/index.js
 *
 *   node scripts/generate-erd.js \
 *     --module ./src/db/index.js \
 *     --out ./docs/database-erd.md \
 *     --direction LR
 *
 *   node scripts/generate-erd.js \
 *     --module ./src/models/index.js \
 *     --include-through
 */

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { createRequire } = require("node:module");

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

const DEFAULTS = {
  module: null,
  out: "./docs/database-erd.md",
  direction: "LR",

  // "markdown" -> ```mermaid ... ```
  // "mermaid"  -> raw Mermaid
  format: "markdown",

  // Show junction table as an entity instead of only an N:M edge.
  includeThrough: false,

  // Include normal table columns inside entities.
  attributes: true,

  // Use physical database table names as labels.
  tableNames: true,

  // Comma-separated model names:
  // --exclude SequelizeMeta,Session
  exclude: [],

  // Comma-separated model names:
  // --include User,Order,Product
  include: [],

  verbose: false,
};

function parseArgs(argv) {
  const config = { ...DEFAULTS };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case "--module":
        config.module = argv[++i];
        break;

      case "--out":
        config.out = argv[++i];
        break;

      case "--direction":
        config.direction = String(argv[++i] || "").toUpperCase();
        break;

      case "--format":
        config.format = String(argv[++i] || "").toLowerCase();
        break;

      case "--include-through":
        config.includeThrough = true;
        break;

      case "--no-attributes":
        config.attributes = false;
        break;

      case "--model-names":
        config.tableNames = false;
        break;

      case "--exclude":
        config.exclude = splitCsv(argv[++i]);
        break;

      case "--include":
        config.include = splitCsv(argv[++i]);
        break;

      case "--verbose":
        config.verbose = true;
        break;

      case "--help":
      case "-h":
        printHelp();
        process.exit(0);

      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown argument: ${arg}`);
        }
    }
  }

  if (!["LR", "RL", "TB", "BT"].includes(config.direction)) {
    throw new Error(
      `Invalid direction "${config.direction}". Use LR, RL, TB, or BT.`,
    );
  }

  if (!["markdown", "mermaid"].includes(config.format)) {
    throw new Error(
      `Invalid format "${config.format}". Use markdown or mermaid.`,
    );
  }

  return config;
}

function splitCsv(value = "") {
  return value
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function printHelp() {
  console.log(`
Generate a Mermaid ER diagram from Sequelize models.

Usage:
  node scripts/generate-erd.js [options]

Options:
  --module <path>        Sequelize/model entry point
                         Default: project model definitions (offline)

  --out <path>           Output path
                         Default: ./docs/database-erd.md

  --format <format>      markdown | mermaid
                         Default: markdown

  --direction <dir>      LR | RL | TB | BT
                         Default: LR

  --include-through      Render many-to-many junction tables

  --no-attributes        Hide columns

  --model-names          Use Sequelize model names instead of DB table names

  --include <models>     Only include these model names
                         Example: User,Order,Product

  --exclude <models>     Exclude these model names
                         Example: SequelizeMeta,Session

  --verbose              Print discovery/debug information

  --help                 Show this help
`);
}

/* -------------------------------------------------------------------------- */
/* General helpers                                                            */
/* -------------------------------------------------------------------------- */

function log(config, ...args) {
  if (config.verbose) {
    console.log("[erd]", ...args);
  }
}

function escapeMermaidString(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll('"', "'")
    .replaceAll("\n", " ")
    .replaceAll("\r", " ");
}

/**
 * Mermaid entity identifiers are easier to work with if they're kept to
 * letters/numbers/underscores.
 *
 * We use an entity alias for the pretty table/model name.
 */
function makeIdentifier(value, usedIdentifiers) {
  let id = String(value ?? "entity")
    .normalize("NFKD")
    .replace(/[^\w]/g, "_")
    .replace(/^(\d)/, "_$1")
    .replace(/_+/g, "_");

  if (!id) {
    id = "entity";
  }

  const base = id;
  let counter = 2;

  while (usedIdentifiers.has(id)) {
    id = `${base}_${counter++}`;
  }

  usedIdentifiers.add(id);

  return id;
}

function normalizeName(value) {
  return String(value ?? "").toLowerCase();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

/* -------------------------------------------------------------------------- */
/* Sequelize discovery                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The module can export any of these:
 *
 * export default sequelize;
 * export { sequelize };
 *
 * module.exports = sequelize;
 * module.exports = { sequelize, User, Order };
 *
 * Or it may export only initialized Model classes.
 */
async function loadSequelizeContext(modulePath, config) {
  if (!modulePath) return loadProjectModels();
  const absolutePath = path.resolve(process.cwd(), modulePath);

  log(config, `Loading ${absolutePath}`);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Model module not found:\n${absolutePath}\n\n` +
      `Pass the correct entry point with --module.`,
    );
  }

  const imported = await import(pathToFileURL(absolutePath).href);

  const candidates = [
    imported,
    imported.default,
    imported.sequelize,
    imported.default?.sequelize,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (isSequelizeInstance(candidate)) {
      return {
        sequelize: candidate,
        models: getModelsFromSequelize(candidate),
      };
    }
  }

  // Look one level through module exports.
  for (const container of [imported, imported.default].filter(Boolean)) {
    if (typeof container !== "object" && typeof container !== "function") {
      continue;
    }

    for (const value of Object.values(container)) {
      if (isSequelizeInstance(value)) {
        return {
          sequelize: value,
          models: getModelsFromSequelize(value),
        };
      }
    }
  }

  // Last fallback: discover initialized Model classes.
  const models = [];

  for (const container of [imported, imported.default].filter(Boolean)) {
    if (typeof container !== "object" && typeof container !== "function") {
      continue;
    }

    for (const value of Object.values(container)) {
      if (isSequelizeModel(value)) {
        models.push(value);
      }
    }
  }

  if (models.length > 0) {
    return {
      sequelize: models[0].sequelize ?? null,
      models: uniqueModels(models),
    };
  }

  throw new Error(`
Could not discover a Sequelize instance or initialized models from:

  ${absolutePath}

The easiest fix is to export your Sequelize instance:

  export { sequelize };

or:

  module.exports = { sequelize };

The module must initialize all associations before this generator imports it.
`.trim());
}

// Load only schema factories: the application entry also imports controllers,
// migrations and configuration, none of which are needed to inspect the schema.
function loadProjectModels() {
  const apiRequire = createRequire(path.join(__dirname, "../api/package.json"));
  const definitions = path.join(__dirname, "../api/src/models/definitions");
  apiRequire("@babel/register")({
    babelrc: false,
    configFile: false,
    cache: false,
    only: [definitions],
    presets: [[apiRequire.resolve("@babel/preset-env"), { targets: { node: "current" }, modules: "commonjs" }]],
  });
  const Sequelize = apiRequire("sequelize");
  const sequelize = new Sequelize("erd", "erd", "", { dialect: "postgres", logging: false });
  const models = {};
  for (const file of fs.readdirSync(definitions).filter((file) => file.endsWith(".js")).sort()) {
    const model = apiRequire(path.join(definitions, file)).default(sequelize);
    models[model.name] = model;
  }
  for (const model of Object.values(models)) {
    model.models = models;
    model.associate?.(models);
  }
  return { sequelize, models: getModelsFromSequelize(sequelize) };
}

function isSequelizeInstance(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    value.models &&
    (typeof value.getQueryInterface === "function" ||
      typeof value.define === "function"),
  );
}

function isSequelizeModel(value) {
  return Boolean(
    typeof value === "function" &&
    value.name &&
    (typeof value.getAttributes === "function" || value.rawAttributes) &&
    value.sequelize,
  );
}

function getModelsFromSequelize(sequelize) {
  const source = sequelize.models;

  if (!source) {
    return [];
  }

  // v6 commonly exposes an object-like ModelManager result.
  if (Array.isArray(source)) {
    return uniqueModels(source);
  }

  // Account for Map / Set-like model collections.
  if (typeof source.values === "function") {
    try {
      return uniqueModels([...source.values()]);
    } catch {
      // fall through
    }
  }

  return uniqueModels(Object.values(source));
}

function uniqueModels(models) {
  return [
    ...new Map(
      models
        .filter(isSequelizeModel)
        .map((model) => [model.name, model]),
    ).values(),
  ];
}

/* -------------------------------------------------------------------------- */
/* Model metadata                                                             */
/* -------------------------------------------------------------------------- */

function getAttributes(model) {
  if (typeof model.getAttributes === "function") {
    return model.getAttributes();
  }

  return model.rawAttributes ?? {};
}

function getTableInfo(model) {
  let table;

  try {
    table =
      typeof model.getTableName === "function"
        ? model.getTableName()
        : model.tableName;
  } catch {
    table = model.tableName;
  }

  if (typeof table === "string") {
    return {
      tableName: table,
      schema: model.options?.schema || null,
    };
  }

  if (table && typeof table === "object") {
    return {
      tableName:
        table.tableName ||
        table.table ||
        model.tableName ||
        model.name,
      schema: table.schema || model.options?.schema || null,
    };
  }

  return {
    tableName: model.tableName || model.name,
    schema: model.options?.schema || null,
  };
}

function getDisplayName(model, config) {
  if (!config.tableNames) {
    return model.name;
  }

  const { tableName, schema } = getTableInfo(model);

  return schema ? `${schema}.${tableName}` : tableName;
}

function getFieldName(attributeName, attribute) {
  return (
    attribute?.field ||
    attribute?.fieldName ||
    attribute?.columnName ||
    attributeName
  );
}

function getTypeName(attribute) {
  const type = attribute?.type;

  if (!type) {
    return "UNKNOWN";
  }

  let value;

  try {
    value = type.toSql?.();
  } catch {
    // Some custom Sequelize datatypes cannot stringify safely.
  }

  value ||= type.key;
  value ||= type.constructor?.key;
  value ||= type.constructor?.name;

  if (!value) {
    try {
      value = String(type);
    } catch {
      value = "UNKNOWN";
    }
  }

  return sanitizeType(value);
}

/**
 * Mermaid attribute types should be simple tokens.
 *
 * VARCHAR(255) -> VARCHAR_255
 * DECIMAL(10,2) -> DECIMAL_10_2
 * TIMESTAMP WITH TIME ZONE -> TIMESTAMP_WITH_TIME_ZONE
 */
function sanitizeType(value) {
  let result = String(value)
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[(),[\]{}]/g, "_")
    .replace(/[^A-Z0-9_.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!result) {
    result = "UNKNOWN";
  }

  // Mermaid parsing is more predictable without dots/dashes in a type.
  return result.replace(/[.-]/g, "_");
}

function getAttributeKeys(attribute) {
  const keys = [];

  if (attribute?.primaryKey) {
    keys.push("PK");
  }

  if (attribute?.references) {
    keys.push("FK");
  }

  if (
    attribute?.unique === true ||
    typeof attribute?.unique === "string"
  ) {
    keys.push("UK");
  }

  return unique(keys);
}

function getAttributeComment(attribute) {
  const comments = [];

  if (attribute?.allowNull === false && !attribute?.primaryKey) {
    comments.push("NOT NULL");
  }

  if (attribute?.autoIncrement) {
    comments.push("AUTO INCREMENT");
  }

  if (attribute?.comment) {
    comments.push(String(attribute.comment));
  }

  return comments.join("; ");
}

/* -------------------------------------------------------------------------- */
/* Association helpers                                                        */
/* -------------------------------------------------------------------------- */

function getAssociations(model) {
  return Object.values(model.associations ?? {});
}

function getAssociationType(association) {
  return (
    association.associationType ||
    association.constructor?.name ||
    ""
  );
}

function getForeignKeyName(association) {
  const foreignKey =
    association.foreignKey ??
    association.options?.foreignKey;

  if (typeof foreignKey === "string") {
    return foreignKey;
  }

  if (foreignKey && typeof foreignKey === "object") {
    return foreignKey.name || foreignKey.fieldName || foreignKey.field;
  }

  return null;
}

function resolveAttribute(model, foreignKey) {
  if (!model || !foreignKey) {
    return null;
  }

  const attributes = getAttributes(model);

  if (attributes[foreignKey]) {
    return {
      name: foreignKey,
      attribute: attributes[foreignKey],
    };
  }

  for (const [name, attribute] of Object.entries(attributes)) {
    if (getFieldName(name, attribute) === foreignKey) {
      return { name, attribute };
    }
  }

  return null;
}

function isForeignKeyNullable(model, foreignKey) {
  const resolved = resolveAttribute(model, foreignKey);

  if (!resolved) {
    // Sequelize's default FK is generally nullable unless explicitly
    // configured otherwise.
    return true;
  }

  return resolved.attribute?.allowNull !== false;
}

function getThroughModel(association) {
  return (
    association.through?.model ||
    association.throughModel ||
    association.options?.through?.model ||
    null
  );
}

function getThroughName(association) {
  const model = getThroughModel(association);

  if (model) {
    return model.name;
  }

  const through =
    association.options?.through ||
    association.through;

  if (typeof through === "string") {
    return through;
  }

  return through?.model?.name || null;
}

/* -------------------------------------------------------------------------- */
/* Relationship normalization                                                 */
/* -------------------------------------------------------------------------- */

/**
 * We normalize HasMany/HasOne/BelongsTo into relationships based on the
 * *foreign-key-owning model*.
 *
 * This lets:
 *
 *   User.hasMany(Post)
 *   Post.belongsTo(User)
 *
 * become one relationship instead of two.
 */
function normalizeAssociation(association) {
  const type = getAssociationType(association);

  const source = association.source;
  const target = association.target;

  if (!source || !target) {
    return null;
  }

  if (type === "BelongsToMany") {
    return normalizeManyToMany(association);
  }

  let parent;
  let child;
  let foreignKey;
  let kind;

  switch (type) {
    case "BelongsTo":
      parent = target;
      child = source;
      foreignKey = getForeignKeyName(association);
      kind = "many-to-one";
      break;

    case "HasMany":
      parent = source;
      child = target;
      foreignKey = getForeignKeyName(association);
      kind = "one-to-many";
      break;

    case "HasOne":
      parent = source;
      child = target;
      foreignKey = getForeignKeyName(association);
      kind = "one-to-one";
      break;

    default:
      return null;
  }

  const nullable = isForeignKeyNullable(child, foreignKey);

  return {
    category: "foreign-key",
    kind,
    parent,
    child,
    foreignKey,
    nullable,
    alias: association.as || null,
    associationType: type,
  };
}

function normalizeManyToMany(association) {
  const source = association.source;
  const target = association.target;
  const throughModel = getThroughModel(association);

  const foreignKey = getForeignKeyName(association);

  let otherKey =
    association.otherKey ??
    association.options?.otherKey;

  if (otherKey && typeof otherKey === "object") {
    otherKey =
      otherKey.name ||
      otherKey.fieldName ||
      otherKey.field;
  }

  return {
    category: "many-to-many",
    kind: "many-to-many",
    source,
    target,
    throughModel,
    throughName: getThroughName(association),
    foreignKey,
    otherKey: otherKey || null,
    alias: association.as || null,
    associationType: "BelongsToMany",
  };
}

/**
 * Score associations so that when inverse declarations exist we keep
 * the most informative representation.
 *
 * Prefer:
 *   HasOne   over BelongsTo for 1:1
 *   HasMany  over BelongsTo for 1:N
 */
function associationScore(relation) {
  switch (relation.associationType) {
    case "HasOne":
      return 30;

    case "HasMany":
      return 20;

    case "BelongsTo":
      return 10;

    default:
      return 0;
  }
}

function deduplicateForeignKeyRelations(relations) {
  const grouped = new Map();

  for (const relation of relations) {
    const key = [
      relation.parent.name,
      relation.child.name,
      relation.foreignKey || "?",
    ].join("::");

    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, relation);
      continue;
    }

    const candidate = mergeRelationInformation(
      existing,
      relation,
    );

    grouped.set(key, candidate);
  }

  return [...grouped.values()];
}

function mergeRelationInformation(a, b) {
  // HasOne is semantically more restrictive than HasMany / BelongsTo.
  let winner;

  if (a.kind === "one-to-one" || b.kind === "one-to-one") {
    winner =
      a.kind === "one-to-one"
        ? { ...a }
        : { ...b };

    winner.kind = "one-to-one";
  } else {
    winner =
      associationScore(a) >= associationScore(b)
        ? { ...a }
        : { ...b };

    winner.kind = "one-to-many";
  }

  winner.alias =
    winner.alias ||
    a.alias ||
    b.alias;

  return winner;
}

function deduplicateManyToMany(relations) {
  const result = new Map();

  for (const relation of relations) {
    const endpoints = [
      relation.source.name,
      relation.target.name,
    ].sort();

    const through =
      relation.throughModel?.name ||
      relation.throughName ||
      "?";

    const key = `${endpoints.join("::")}::${through}`;

    if (!result.has(key)) {
      result.set(key, relation);
    }
  }

  return [...result.values()];
}

/* -------------------------------------------------------------------------- */
/* Cardinality                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Mermaid:
 *
 * || = exactly one
 * o| = zero or one
 * |{ = one or more
 * o{ = zero or more
 *
 * Sequelize association declarations don't always contain enough information
 * to prove "at least one child", so collection sides are conservatively 0..*.
 */
function foreignKeyCardinality(relation) {
  return {
    parentSide: relation.nullable ? "|o" : "||",
    childSide: relation.kind === "one-to-one" ? "o|" : "o{",
  };
}

/* -------------------------------------------------------------------------- */
/* Diagram model                                                              */
/* -------------------------------------------------------------------------- */

function shouldIncludeModel(model, config) {
  const include = new Set(config.include.map(normalizeName));
  const exclude = new Set(config.exclude.map(normalizeName));

  const names = [
    model.name,
    getTableInfo(model).tableName,
    getDisplayName(model, config),
  ].map(normalizeName);

  if (include.size && !names.some((name) => include.has(name))) {
    return false;
  }

  if (names.some((name) => exclude.has(name))) {
    return false;
  }

  return true;
}

function buildDiagramModel(allModels, config) {
  let models = allModels.filter((model) =>
    shouldIncludeModel(model, config),
  );

  const relations = [];

  for (const model of models) {
    for (const association of getAssociations(model)) {
      const normalized = normalizeAssociation(association);

      if (normalized) {
        relations.push(normalized);
      }
    }
  }

  let fkRelations = deduplicateForeignKeyRelations(
    relations.filter(
      (relation) => relation.category === "foreign-key",
    ),
  );

  let manyToMany = deduplicateManyToMany(
    relations.filter(
      (relation) => relation.category === "many-to-many",
    ),
  );

  // Only retain relationships whose endpoints are visible.
  const includedNames = new Set(models.map((model) => model.name));

  fkRelations = fkRelations.filter(
    (relation) =>
      includedNames.has(relation.parent.name) &&
      includedNames.has(relation.child.name),
  );

  manyToMany = manyToMany.filter(
    (relation) =>
      includedNames.has(relation.source.name) &&
      includedNames.has(relation.target.name),
  );

  if (config.includeThrough) {
    const throughModels = manyToMany
      .map((relation) => relation.throughModel)
      .filter(Boolean)
      .filter((model) => shouldIncludeModel(model, config));

    models = uniqueModels([...models, ...throughModels]);
  }

  return {
    models,
    fkRelations,
    manyToMany,
  };
}

/* -------------------------------------------------------------------------- */
/* Mermaid rendering                                                          */
/* -------------------------------------------------------------------------- */

function buildEntityMap(models, config) {
  const usedIdentifiers = new Set();
  const entities = new Map();

  for (const model of models) {
    entities.set(model.name, {
      model,
      id: makeIdentifier(model.name, usedIdentifiers),
      label: getDisplayName(model, config),
    });
  }

  return entities;
}

function renderEntity(entity, config) {
  const { model, id, label } = entity;

  const alias =
    label !== id
      ? `${id}["${escapeMermaidString(label)}"]`
      : id;

  if (!config.attributes) {
    return `  ${alias}`;
  }

  const attributes = getAttributes(model);
  const lines = [`  ${alias} {`];
  const columns = new Map();

  for (const [attributeName, attribute] of Object.entries(attributes)) {
    const fieldName = getFieldName(attributeName, attribute);
    // Explicit snake_case timestamps and Sequelize's generated camelCase
    // attributes can refer to the same physical column. Prefer the explicit
    // definition so its comments and constraints are retained.
    if (!columns.has(fieldName) || attributeName === fieldName) {
      columns.set(fieldName, attribute);
    }
  }

  for (const [fieldName, attribute] of columns) {
    const type = getTypeName(attribute);

    // Keep field identifiers Mermaid-safe.
    const safeFieldName = String(fieldName)
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "_");

    const keys = getAttributeKeys(attribute);
    const comment = getAttributeComment(attribute);

    let line = `    ${type} ${safeFieldName}`;

    if (keys.length) {
      line += ` ${keys.join(",")}`;
    }

    if (comment) {
      line += ` "${escapeMermaidString(comment)}"`;
    }

    lines.push(line);
  }

  lines.push("  }");

  return lines.join("\n");
}

function relationLabel(relation) {
  if (relation.foreignKey) {
    return relation.alias
      ? `${relation.alias} (${relation.foreignKey})`
      : relation.foreignKey;
  }

  return relation.alias || "relates";
}

function renderForeignKeyRelation(relation, entities) {
  const parent = entities.get(relation.parent.name);
  const child = entities.get(relation.child.name);

  if (!parent || !child) {
    return null;
  }

  const cardinality = foreignKeyCardinality(relation);
  const label = escapeMermaidString(relationLabel(relation));

  if (relation.kind === "one-to-one") {
    return (
      `  ${parent.id} ${cardinality.parentSide}--${cardinality.childSide} ` +
      `${child.id} : "${label}"`
    );
  }

  return (
    `  ${parent.id} ${cardinality.parentSide}--${cardinality.childSide} ${child.id} : "${label}"`
  );
}

function renderDirectManyToMany(relation, entities) {
  const source = entities.get(relation.source.name);
  const target = entities.get(relation.target.name);

  if (!source || !target) {
    return null;
  }

  const through =
    relation.throughModel?.name ||
    relation.throughName;

  const label = escapeMermaidString(
    relation.alias
      ? `${relation.alias}${through ? ` via ${through}` : ""}`
      : through
        ? `via ${through}`
        : "many-to-many",
  );

  return (
    `  ${source.id} }o--o{ ${target.id} : "${label}"`
  );
}

function renderExpandedManyToMany(
  relation,
  entities,
) {
  const source = entities.get(relation.source.name);
  const target = entities.get(relation.target.name);

  const throughName =
    relation.throughModel?.name ||
    relation.throughName;

  const through = entities.get(throughName);

  if (!source || !target || !through) {
    return [];
  }

  return [
    `  ${source.id} ||--o{ ${through.id} : "${escapeMermaidString(
      relation.foreignKey || "junction",
    )}"`,
    `  ${target.id} ||--o{ ${through.id} : "${escapeMermaidString(
      relation.otherKey || "junction",
    )}"`,
  ];
}

function renderMermaid(diagram, config) {
  const entities = buildEntityMap(diagram.models, config);

  const lines = [
    "erDiagram",
    `  direction ${config.direction}`,
    "",
  ];

  const sortedEntities = [...entities.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  for (const entity of sortedEntities) {
    lines.push(renderEntity(entity, config));
    lines.push("");
  }

  const relationshipLines = [];

  for (const relation of diagram.fkRelations) {
    const rendered = renderForeignKeyRelation(
      relation,
      entities,
    );

    if (rendered) {
      relationshipLines.push(rendered);
    }
  }

  for (const relation of diagram.manyToMany) {
    if (config.includeThrough) {
      relationshipLines.push(
        ...renderExpandedManyToMany(
          relation,
          entities,
        ),
      );
    } else {
      const rendered = renderDirectManyToMany(
        relation,
        entities,
      );

      if (rendered) {
        relationshipLines.push(rendered);
      }
    }
  }

  lines.push(
    ...unique(relationshipLines).sort(),
  );

  return lines.join("\n").trim() + "\n";
}

/* -------------------------------------------------------------------------- */
/* Output                                                                     */
/* -------------------------------------------------------------------------- */

function renderOutput(mermaid, config, stats) {
  if (config.format === "mermaid") {
    return [
      "%% Legend: || = 1; |o / o| = 0..1; }o / o{ = 0..N; }| / |{ = 1..N",
      "%% A ||--o{ B: each B has exactly one A; each A has zero or many B.",
      "%% A }o--o{ B: N:N, optional on both sides.",
      mermaid,
    ].join("\n");
  }

  return `# Database ER Diagram

> Generated automatically from Sequelize models.
> Do not edit this diagram manually.

- Models: ${stats.models}
- Foreign-key relationships: ${stats.foreignKeyRelations}
- Many-to-many relationships: ${stats.manyToManyRelations}

## Relationship legend

The symbol next to an entity says how many of that entity can relate to one entity at the other end. Symbols are mirrored on the left and right.

- \`||\` = exactly **1**.
- \`|o\` (left) or \`o|\` (right) = **0..1** (optional).
- \`}o\` (left) or \`o{\` (right) = **0..N** (zero or many).
- \`}|\` (left) or \`|{\` (right) = **1..N** (at least one).

Examples:

- \`Parent ||--o{ Child\` = **1:N**: each child has exactly one parent; a parent can have zero or many children.
- \`Parent |o--o{ Child\` = **1:N with an optional parent**: each child has zero or one parent; a parent can have zero or many children.
- \`Parent ||--o| Child\` = **1:1**: each child has exactly one parent; a parent can have zero or one child.
- \`A }o--o{ B\` = **N:N**: both sides can have zero or many matches, via a junction table.

Line labels name the Sequelize association and its foreign key. **PK** = primary key, **FK** = foreign key, **UK** = unique key. Cardinalities reflect the model declarations; a collection is shown as optional because declaring an association does not require a parent to have children.

## Diagram

\`\`\`mermaid
${mermaid.trim()}
\`\`\`

---
Generated by \`scripts/generate-erd.js\`.
`;
}

function writeOutput(content, outputPath) {
  const absolutePath = path.resolve(
    process.cwd(),
    outputPath,
  );

  fs.mkdirSync(path.dirname(absolutePath), {
    recursive: true,
  });

  fs.writeFileSync(absolutePath, content, "utf8");

  return absolutePath;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  const config = parseArgs(process.argv.slice(2));

  const { models: discoveredModels } =
    await loadSequelizeContext(config.module, config);

  if (!discoveredModels.length) {
    throw new Error(
      "No initialized Sequelize models were discovered.",
    );
  }

  log(
    config,
    `Discovered ${discoveredModels.length} models:`,
    discoveredModels.map((model) => model.name).join(", "),
  );

  const diagram = buildDiagramModel(
    discoveredModels,
    config,
  );

  if (!diagram.models.length) {
    throw new Error(
      "No models remain after applying include/exclude filters.",
    );
  }

  const mermaid = renderMermaid(diagram, config);

  const stats = {
    models: diagram.models.length,
    foreignKeyRelations: diagram.fkRelations.length,
    manyToManyRelations: diagram.manyToMany.length,
  };

  const output = renderOutput(
    mermaid,
    config,
    stats,
  );

  const absoluteOutput = writeOutput(
    output,
    config.out,
  );

  console.log("");
  console.log("Database ERD generated successfully.");
  console.log("");
  console.log(`  Models:              ${stats.models}`);
  console.log(
    `  FK relationships:    ${stats.foreignKeyRelations}`,
  );
  console.log(
    `  M:N relationships:   ${stats.manyToManyRelations}`,
  );
  console.log(`  Output:              ${absoluteOutput}`);
  console.log("");
}

module.exports = { DEFAULTS, buildDiagramModel, renderMermaid, loadProjectModels };

if (require.main === module) main().catch((error) => {
  console.error("");
  console.error("Failed to generate Sequelize ERD.");
  console.error("");
  console.error(error?.stack || error);
  console.error("");

  process.exitCode = 1;
});

