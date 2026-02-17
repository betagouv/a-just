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

// Seed for deterministic anonymization - ensures reproducible output
// Same seed + same input = same anonymized output
const ANONYMIZATION_SEED = "ajust-e2e-test-seed-2024";

// Fixed label for the first backup - used by E2E tests
const E2E_TEST_BACKUP_LABEL = "E2E Test Backup";

const args = process.argv.slice(2);

const userTestEmail = "utilisateurtest@a-just.fr"

// Seeded random number generator for deterministic anonymization
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    // Simple LCG (Linear Congruential Generator)
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
}

// Create seeded RNG from secret key
const seedFromKey = (key) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};

let seededRandom;

const getArgValue = (flag) => {
  const found = args.find((arg) => arg.startsWith(`${flag}=`));
  return found ? found.split("=")[1] : null;
};

const options = {
  input: getArgValue("--input") || DEFAULT_INPUT,
  output: getArgValue("--output") || DEFAULT_OUTPUT,
  dryRun: args.includes("--dry-run"),
  seed: getArgValue("--seed") || ANONYMIZATION_SEED,
};

const hrBackupIds = [];

const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const blockThemesToAnonymize = [
  "Users",
  "HRBackups",
  "HRVentilations",
  "HumanResources",
  "HRSituations",
  "TJ",
  "Logs",
  "OptionsBackups",
];
const blockThemesToRemoveElems = ["Notifications", "Comments", "HRComments"];

const hashName = (originalName, seed) => {
  if (!originalName || typeof originalName !== "string") {
    return "anonyme";
  }
  // Use seeded random for deterministic hashing
  const randomValue = seededRandom.next();
  const uniqueInput = `${originalName}:${seed}:${randomValue}`;
  const hash = crypto
    .createHmac("sha256", seed)
    .update(uniqueInput)
    .digest("hex")
    .substring(0, 10);
  return hash;
};

const hashEmail = (originalEmail, seed) => {
  if (!originalEmail || typeof originalEmail !== "string") {
    return "anonyme@example.test";
  }
  // Use seeded random for deterministic hashing
  const randomValue = seededRandom.next();
  const uniqueInput = `${originalEmail}:${seed}:${randomValue}`;
  const hash = crypto
    .createHmac("sha256", seed)
    .update(uniqueInput)
    .digest("hex")
    .substring(0, 12);
  return hash;
};

let isFirstBackup = true; // Track if we're processing the first backup
let e2eBackupId = null;
let peopleToReassign = [];
let situationsToOverride = new Set();

const anonymizeLine = (line, theme, seed, hrBackupIds) => {
  let result = line;
  let elements = line.split("\t");

  switch (theme) {
    case "Users":
      elements[1] = elements[1] !== userTestEmail ? hashEmail(elements[1], seed) : elements[1];
      elements[6] = hashName(elements[6], seed);
      elements[7] = hashName(elements[7], seed);
      elements[11] = hashName(elements[11], seed);
      elements[12] = hashName(elements[12], seed);
      result = elements.join("\t");
      break;
    case "HRBackups":
      // Keep first backup with fixed label for E2E tests, anonymize others
      if (isFirstBackup) {
        elements[1] = E2E_TEST_BACKUP_LABEL;
        e2eBackupId = elements[0]; // Capture E2E backup ID
        result = elements.join("\t");
        isFirstBackup = false;
      } else {
        result = result.replace(elements[1], (match, name) => {
          const hashedName = hashName(match, seed);
          return `${hashedName}`;
        });
      }
      break;
    case "HRVentilations": {
      const lastIndex = elements.length - 1;
      if (lastIndex >= 0 && hrBackupIds && hrBackupIds.length > 0) {
        // Use seeded random for deterministic backup assignment
        const randomId =
          hrBackupIds[Math.floor(seededRandom.next() * hrBackupIds.length)];
        elements[lastIndex] = randomId;
        result = elements.join("\t");
      }
      break;
    }
    case "HumanResources":
      elements[1] = hashName(elements[1], seed);
      elements[2] = hashName(elements[2], seed);
      elements[9] = hashName(elements[9], seed);
      elements[11] = hashName(elements[11], seed);
      elements[12] = hashName(elements[12], seed);

      const personId = elements[0];

      // Check if this person was marked for reassignment in HRSituations
      if (peopleToReassign.includes(personId)) {
        // Reassign to E2E backup
        elements[10] = e2eBackupId;
        console.log(`Reassigning person ${personId} to E2E backup`);
      } else if (hrBackupIds && hrBackupIds.length > 0) {
        // Random assignment for everyone else
        const randomBackupId = hrBackupIds[Math.floor(seededRandom.next() * hrBackupIds.length)];
        elements[10] = randomBackupId;
      }

      result = elements.join("\t");
      break;
    case "TJ":
      elements[2] = hashName(elements[2], seed);
      result = elements.join("\t");
      break;
    case "OptionsBackups":
      elements[1] = hashName(elements[1], seed);
      result = elements.join("\t");
      break;
    case "HRSituations": {
      // Find first 10 people with situations starting in 2025 and override their category and function
      const humanId = elements[1];
      const dateStart = elements[5]; // date_start is column 5

      // Check if date_start is in 2025 (starts with "2025")
      if (dateStart && dateStart.startsWith("2025") && peopleToReassign.length < 10) {
        // Mark this person for reassignment to E2E backup
        peopleToReassign.push(humanId);
        // Override category to 'Autour du magistrat' (column 3)
        elements[3] = "3";
        // Override function to 'Att. J' (column 4)
        elements[4] = "69";
        result = elements.join("\t");
        console.log(`Overriding to 'Att. J' for person ${humanId} starting ${dateStart.substring(0, 10)} (${peopleToReassign.length}/10)`);
      }
      break;
    }
    case "Logs":
      elements[2] = hashName(elements[2], seed);
      elements[7] = hashName(elements[7], seed);
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

  // Initialize seeded random for deterministic anonymization
  const seed = seedFromKey(options.seed);
  seededRandom = new SeededRandom(seed);
  console.log(`Using deterministic anonymization seed: ${options.seed}`);

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
        options.seed,
        hrBackupIds,
      );
      if (isHRBackupBlock) {
        const id = line.split("\t")[0];
        if (id) hrBackupIds.push(id);
      }
      outputStream.write(`${anonymized}\n`);
    } else if (inCopyBlock && shouldRemoveCopy) {
      // Skip this line
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
