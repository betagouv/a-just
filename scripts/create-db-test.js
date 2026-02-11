#!/usr/bin/env node

/**
 * Script d'aide pour lire et anonymiser le dump de test `test_tmp.sql`.
 *
 * Par defaut le script lit `../api/test/db/test_tmp.sql` ou "../api/test/db/test_tmp.sql.gz", le decompresse si besoins
 * et applique des regles d'anonymisation. Le
 * resultat est ecrit dans `../api/test/db/test_tmp.anonymized.sql`.
 *
 * Usage :
 *   node scripts/create-db-test.js
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const crypto = require("crypto");

const findInputFile = () => {
  const dbDir = path.resolve(__dirname, "../api/test/db");
  const gzFile = path.join(dbDir, "test_tmp.sql.gz");
  const sqlFile = path.join(dbDir, "test_tmp.sql");

  if (fs.existsSync(gzFile)) {
    return gzFile;
  } else if (fs.existsSync(sqlFile)) {
    return sqlFile;
  }
  return gzFile;
};

const DEFAULT_INPUT = findInputFile();
const DEFAULT_OUTPUT = path.resolve(
  __dirname,
  "../api/test/db/test_tmp_anonymized.sql",
);
const DEFAULT_SECRET_KEY =
  process.env.SECRET_KEY || "default-secret-key-change-me";

const args = process.argv.slice(2);

const getArgValue = (flag) => {
  const found = args.find((arg) => arg.startsWith(`${flag}=`));
  return found ? found.split("=")[1] : null;
};

const options = {
  input: getArgValue("--input") || DEFAULT_INPUT,
  output: getArgValue("--output") || DEFAULT_OUTPUT,
  dryRun: args.includes("--dry-run"),
  secretKey: getArgValue("--secret-key") || DEFAULT_SECRET_KEY,
};

const hrBackupIds = [];

const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const blockThemesToAnonymize = [
  "Users",
  "HRBackups",
  "HRVentilations",
  "HumanResources",
  "TJ",
  "Logs",
  "OptionsBackups",
];
const blockThemesToRemoveElems = ["Notifications", "Comments", "HRComments"];

const hashName = (originalName, secretKey) => {
  if (!originalName || typeof originalName !== "string") {
    return "anonyme";
  }
  const uniqueInput = `${originalName}:${secretKey}:${Date.now()}:${Math.random()}`;
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(uniqueInput)
    .digest("hex")
    .substring(0, 10);
  return hash;
};

const hashEmail = (originalEmail, secretKey) => {
  if (!originalEmail || typeof originalEmail !== "string") {
    return "anonyme@example.test";
  }
  const uniqueInput = `${originalEmail}:${secretKey}:${Date.now()}:${Math.random()}`;
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(uniqueInput)
    .digest("hex")
    .substring(0, 12);
  return hash;
};

const anonymizeLine = (line, theme, secretKey, hrBackupIds) => {
  let result = line;
  let elements = line.split("\t");

  switch (theme) {
    case "Users":
      elements[1] = hashEmail(elements[1], secretKey);
      elements[6] = hashName(elements[6], secretKey);
      elements[7] = hashName(elements[7], secretKey);
      elements[11] = hashName(elements[11], secretKey);
      elements[12] = hashName(elements[12], secretKey);
      result = elements.join("\t");
      break;
    case "HRBackups":
      result = result.replace(elements[1], (match, name) => {
        const hashedName = hashName(match, secretKey);
        return `${hashedName}`;
      });
      break;
    case "HRVentilations": {
      const lastIndex = elements.length - 1;
      if (lastIndex >= 0 && hrBackupIds && hrBackupIds.length > 0) {
        const randomId =
          hrBackupIds[Math.floor(Math.random() * hrBackupIds.length)];
        elements[lastIndex] = randomId;
        result = elements.join("\t");
      }
      break;
    }
    case "HumanResources":
      elements[1] = hashName(elements[1], secretKey);
      elements[2] = hashName(elements[2], secretKey);
      elements[9] = hashName(elements[9], secretKey);
      elements[11] = hashName(elements[11], secretKey);
      elements[12] = hashName(elements[12], secretKey);
      result = elements.join("\t");
      break;
    case "TJ":
      elements[2] = hashName(elements[2], secretKey);
      result = elements.join("\t");
      break;
    case "OptionsBackups":
      elements[1] = hashName(elements[1], secretKey);
      result = elements.join("\t");
      break;
    case "Logs":
      elements[2] = hashName(elements[2], secretKey);
      elements[7] = hashName(elements[7], secretKey);
      result = elements.join("\t");
      break;
    default:
      break;
  }
  return result;
};

const ensureInputExists = (inputPath) => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Fichier introuvable : ${inputPath}`);
  }
};

async function anonymizeDump() {
  ensureInputExists(options.input);

  console.log(`Lecture : ${options.input}`);
  if (options.dryRun) {
    console.log("Sortie : stdout (dry-run)");
  } else {
    console.log(`Ecriture : ${options.output}`);
  }

  const isGzipped = options.input.endsWith(".gz");
  let sourceStream = fs.createReadStream(options.input);

  if (isGzipped) {
    const gunzipStream = zlib.createGunzip();
    sourceStream = sourceStream.pipe(gunzipStream);
  }

  const rl = readline.createInterface({
    input: sourceStream,
    crlfDelay: Infinity,
  });

  const outputStream = options.dryRun
    ? process.stdout
    : fs.createWriteStream(options.output, { encoding: "utf8" });

  let inCopyBlock = false;
  let shouldAnonymizeCopy = false;
  let shouldRemoveCopy = false;
  let currentTheme = null;
  let isHRBackupBlock = false;

  for await (const line of rl) {
    if (line.includes("COPY public.")) {
      shouldAnonymizeCopy = blockThemesToAnonymize.some((t) =>
        new RegExp(`\\b${t}\\b`, "i").test(line),
      );
      shouldRemoveCopy = blockThemesToRemoveElems.some((t) => line.includes(t));
      currentTheme = blockThemesToAnonymize.find((t) => line.includes(t));
      isHRBackupBlock = line.includes(`"HRBackups"`);
      inCopyBlock = true;
      outputStream.write(`${line}\n`);
    } else if (inCopyBlock && line.startsWith("\\.")) {
      inCopyBlock = false;
      shouldAnonymizeCopy = false;
      shouldRemoveCopy = false;
      currentTheme = null;
      isHRBackupBlock = false;
      outputStream.write(`${line}\n`);
    } else if (inCopyBlock && shouldAnonymizeCopy) {
      const anonymized = anonymizeLine(
        line,
        currentTheme,
        options.secretKey,
        hrBackupIds,
      );
      if (isHRBackupBlock) {
        const id = line.split("\t")[0];
        if (id) hrBackupIds.push(id);
      }
      outputStream.write(`${anonymized}\n`);
    } else if (inCopyBlock && shouldRemoveCopy) {
      // outputStream.write(`\n`);
    } else {
      outputStream.write(`${line}\n`);
    }
  }

  console.log("Anonymisation terminee.");
}

anonymizeDump().catch((err) => {
  console.error("Erreur lors de l'anonymisation :", err.message || err);
  process.exit(1);
});
