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

// Fixed label for the first backup - used by E2E tests (matches parent TJ name)
const E2E_TEST_BACKUP_LABEL = "TJ TEST";

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
let attJPeopleFor2025 = []; // Collect real Att. J people with 2025 situations
let tjTypeMap = new Map(); // Map TJ id -> type (TGI, TPRX, CPH)
let nextTjId = 10000; // Start ID for test établissements
let keptPeopleIds = new Set(); // Track IDs of people we're keeping

// Specific people to include in E2E test backup
const specificPeopleForE2E = [
  '38577', '42830', '42829', '27096', '39168', '37712',
  '36162', '27435', '35310', '42838', '42836', '38576'
];

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
      // Keep ONLY first backup with fixed label for E2E tests, skip all others
      if (isFirstBackup) {
        elements[1] = E2E_TEST_BACKUP_LABEL;
        e2eBackupId = elements[0]; // Capture E2E backup ID
        result = elements.join("\t");
        isFirstBackup = false;
      } else {
        // Skip all other backups to reduce DB size
        return null;
      }
      break;
    case "HRVentilations": {
      // Only keep ventilations for E2E backup
      const backupId = elements[elements.length - 1];
      if (backupId !== e2eBackupId) {
        return null;
      }
      result = elements.join("\t");
      break;
    }
    case "HumanResources":
      const personId = elements[0];
      const originalJuridiction = elements[12]; // Capture BEFORE anonymizing
      const backupId = elements[10]; // backup_id column

      // Only keep people in E2E backup or those we want to assign to it
      const shouldKeep = backupId === e2eBackupId ||
        attJPeopleFor2025.includes(personId) ||
        specificPeopleForE2E.includes(personId);

      if (!shouldKeep) {
        // Skip all people not in E2E backup to reduce DB size
        return null;
      }

      elements[1] = hashName(elements[1], seed);
      elements[2] = hashName(elements[2], seed);
      elements[9] = hashName(elements[9], seed);
      elements[11] = hashName(elements[11], seed);

      // Assign to E2E backup
      elements[10] = e2eBackupId;
      keptPeopleIds.add(personId); // Track this person
      if (specificPeopleForE2E.includes(personId)) {
        console.log(`Keeping specific person ${personId} in E2E test backup`);
      }

      // Map juridiction to test établissements
      if (originalJuridiction && originalJuridiction !== '\\N' && originalJuridiction.trim() !== '') {
        // Try to determine type from original juridiction
        let testJuridiction = 'TJ TEST'; // default to TGI

        if (originalJuridiction.includes('TPRX') || originalJuridiction.includes('TPR ')) {
          testJuridiction = 'TPRX TEST';
        } else if (originalJuridiction.includes('CPH')) {
          testJuridiction = 'CPH TEST';
        }

        elements[12] = testJuridiction;
        console.log(`Person ${personId} in E2E backup: ${originalJuridiction} -> ${testJuridiction}`);
      } else {
        // For NULL juridiction, randomly assign 10% to TPRX, 10% to CPH, 80% to TJ
        const random = seededRandom.next();
        let testJuridiction;

        if (random < 0.1) {
          testJuridiction = 'TPRX TEST';
        } else if (random < 0.2) {
          testJuridiction = 'CPH TEST';
        } else {
          testJuridiction = 'TJ TEST';
        }

        elements[12] = testJuridiction;
        console.log(`Person ${personId} in E2E backup: NULL -> ${testJuridiction} (random=${random.toFixed(3)})`);
      }

      result = elements.join("\t");
      break;
    case "TJ": {
      const tjId = elements[0];
      const tjType = elements[10]; // type column (TGI, TPRX, CPH)

      // Track TJ type for later use
      if (tjId && tjType) {
        tjTypeMap.set(tjId, tjType);
      }

      elements[2] = hashName(elements[2], seed);
      result = elements.join("\t");
      break;
    }
    case "OptionsBackups":
      elements[1] = hashName(elements[1], seed);
      result = elements.join("\t");
      break;
    case "HRSituations": {
      // Collect real Att. J people with situations starting in 2025
      const humanId = elements[1];
      const fonctionId = elements[4]; // fonction_id is column 4
      const dateStart = elements[5]; // date_start is column 5

      // Check if this is a real Att. J person (fonction_id = 69) with situation starting in 2025
      if (fonctionId === "69" && dateStart && dateStart.startsWith("2025") && attJPeopleFor2025.length < 10) {
        attJPeopleFor2025.push(humanId);
        console.log(`Found Att. J person ${humanId} with 2025 situation (${attJPeopleFor2025.length}/10)`);
      }

      // Only keep situations for people in E2E backup
      if (!keptPeopleIds.has(humanId)) {
        return null;
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

async function collectMetadata() {
  // First pass: collect E2E backup ID and Att. J people
  console.log("=== PASS 1: Collecting metadata ===");
  ensureInputExists(options.input);

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

  let inCopyBlock = false;
  let currentTheme = null;
  let isFirstBackup = true;

  for await (const line of rl) {
    if (line.includes("COPY public.")) {
      currentTheme = blockThemesToAnonymize.find((t) => line.includes(t));
      inCopyBlock = true;
    } else if (inCopyBlock && line.startsWith("\\.")) {
      inCopyBlock = false;
      currentTheme = null;
    } else if (inCopyBlock && currentTheme === "HRBackups") {
      if (isFirstBackup) {
        const elements = line.split("\t");
        e2eBackupId = elements[0];
        console.log(`Found E2E backup ID: ${e2eBackupId}`);
        isFirstBackup = false;
      }
    } else if (inCopyBlock && currentTheme === "HRSituations") {
      const elements = line.split("\t");
      const humanId = elements[1];
      const fonctionId = elements[4];
      const dateStart = elements[5];

      if (fonctionId === "69" && dateStart && dateStart.startsWith("2025") && attJPeopleFor2025.length < 10) {
        attJPeopleFor2025.push(humanId);
        console.log(`Found Att. J person ${humanId} with 2025 situation (${attJPeopleFor2025.length}/10)`);
      }
    } else if (inCopyBlock && currentTheme === "HumanResources" && e2eBackupId) {
      const elements = line.split("\t");
      const personId = elements[0];
      const backupId = elements[10];

      if (backupId === e2eBackupId || attJPeopleFor2025.includes(personId) || specificPeopleForE2E.includes(personId)) {
        keptPeopleIds.add(personId);
      }
    }
  }

  console.log(`Collected ${keptPeopleIds.size} people for E2E backup`);
  console.log(`Collected ${attJPeopleFor2025.length} Att. J people`);
}

async function anonymizeDump() {
  // Second pass: filter and anonymize
  console.log("=== PASS 2: Filtering and anonymizing ===");
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
  let isTJBlock = false;

  for await (const line of rl) {
    if (line.includes("COPY public.")) {
      shouldAnonymizeCopy = blockThemesToAnonymize.some((t) =>
        new RegExp(`\\b${t}\\b`, "i").test(line),
      );
      shouldRemoveCopy = blockThemesToRemoveElems.some((t) => line.includes(t));
      currentTheme = blockThemesToAnonymize.find((t) => line.includes(t));
      isHRBackupBlock = line.includes(`"HRBackups"`);
      isTJBlock = line.includes(`"TJ"`);
      inCopyBlock = true;
      outputStream.write(`${line}\n`);
    } else if (inCopyBlock && line.startsWith("\\.")) {
      // Before closing TJ block, insert test établissements
      if (isTJBlock && e2eBackupId) {
        const timestamp = new Date().toISOString();
        const parentTjId = nextTjId++;

        // Insert parent TJ record (following production naming: backup name = TGI name)
        const parentTj = [
          parentTjId,
          '0',
          'TJ TEST',
          '0',
          '0',
          '0',
          't',
          timestamp,
          timestamp,
          '\\N',
          '\\N',
          '\\N',
          '\\N'
        ].join('\t');
        outputStream.write(`${parentTj}\n`);
        console.log('Created parent TJ record: TJ TEST');

        // Insert TJ TEST (TGI type) as child of parent
        const tjTest = [
          nextTjId++,
          '0',
          'TJ TEST',
          '0',
          '0',
          '0',
          't',
          timestamp,
          timestamp,
          '\\N',
          'TGI',
          parentTjId,
          e2eBackupId
        ].join('\t');
        outputStream.write(`${tjTest}\n`);
        console.log('Created TJ TEST (TGI) établissement');

        // Insert TPRX TEST as child of parent
        const tprxTest = [
          nextTjId++,
          '0',
          'TPRX TEST',
          '0',
          '0',
          '0',
          't',
          timestamp,
          timestamp,
          '\\N',
          'TPRX',
          parentTjId,
          e2eBackupId
        ].join('\t');
        outputStream.write(`${tprxTest}\n`);
        console.log('Created TPRX TEST établissement');

        // Insert CPH TEST as child of parent
        const cphTest = [
          nextTjId++,
          '0',
          'CPH TEST',
          '0',
          '0',
          '0',
          't',
          timestamp,
          timestamp,
          '\\N',
          'CPH',
          parentTjId,
          e2eBackupId
        ].join('\t');
        outputStream.write(`${cphTest}\n`);
        console.log('Created CPH TEST établissement');
      }

      inCopyBlock = false;
      shouldAnonymizeCopy = false;
      shouldRemoveCopy = false;
      currentTheme = null;
      isHRBackupBlock = false;
      isTJBlock = false;
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
      // Only write if anonymizeLine didn't return null (filtered out)
      if (anonymized !== null) {
        outputStream.write(`${anonymized}\n`);
      }
    } else if (inCopyBlock && shouldRemoveCopy) {
      // Skip this line
    } else {
      outputStream.write(`${line}\n`);
    }
  }

  console.log("Anonymisation terminee.");
}

async function main() {
  await collectMetadata();
  await anonymizeDump();
}

main().catch((err) => {
  console.error("Erreur lors de l'anonymisation :", err.message || err);
  process.exit(1);
});
