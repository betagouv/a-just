#!/usr/bin/env node

/**
 * Script d'aide pour lire et anonymiser le dump de test `test_tmp.sql.gz`.
 *
 * Par defaut le script lit `../api/test/db/test_tmp.sql.gz`, le decompresse
 * et applique des regles simples d'anonymisation (emails + nom/prenom). Le
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

const DEFAULT_INPUT = path.resolve(__dirname, "../api/test/db/backup.sql");
const DEFAULT_OUTPUT = path.resolve(
  __dirname,
  "../api/test/db/test_tmp_anonymized.sql"
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
];
const blockThemesToRemoveElems = ["Notifications"];

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
      result = result.replace(emailRegex, (match) => {
        return hashEmail(match, secretKey);
      });
      result = result.replace(elements[6], (match, name) => {
        const hashedName = hashName(match, secretKey);
        return `${hashedName}`;
      });
      result = result.replace(elements[7], (match, name) => {
        const hashedName = hashName(match, secretKey);
        return `${hashedName}`;
      });
      result = result.replace(elements[11], (match, name) => {
        const hashedName = hashName(match, secretKey);
        return `${hashedName}`;
      });
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
      result = result.replace(elements[1], (match, name) => {
        const hashedName = hashName(match, secretKey);
        return `${hashedName}`;
      });
      result = result.replace(elements[2], (match, name) => {
        const hashedName = hashName(match, secretKey);
        return `${hashedName}`;
      });
      result = result.replace(elements[11], (match, name) => {
        const hashedName = hashName(match, secretKey);
        return `${hashedName}`;
      });
      result = result.replace(elements[12], (match, name) => {
        const hashedName = hashName(match, secretKey);
        return `${hashedName}`;
      });
      break;
    case "TJ":
      result = result.replace(elements[2], (match, name) => {
        const hashedName = hashName(match, secretKey);
        return `${hashedName}`;
      });
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

  const gunzipStream = zlib.createGunzip();
  const sourceStream = fs.createReadStream(options.input); //.pipe(gunzipStream);
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
        new RegExp(`\\b${t}\\b`, "i").test(line)
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
        hrBackupIds
      );
      if (isHRBackupBlock) {
        const id = line.split("\t")[0];
        if (id) hrBackupIds.push(id);
      }
      outputStream.write(`${anonymized}\n`);
    } else if (inCopyBlock && shouldRemoveCopy) {
      outputStream.write(`\n`);
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
