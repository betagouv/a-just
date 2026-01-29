#!/usr/bin/env node
/**
 * CLI tool to compare two Excel files (extracteur exports)
 * 
 * Usage:
 *   comparateur-extracteurs fileA.xlsx fileB.xlsx
 * 
 * Exit codes:
 *   0 = files are identical
 *   1 = files have differences (diff printed to stdout)
 *   2 = error (file not found, invalid Excel, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import { readAndNormalizeExcel, compareExcelFiles } from './compare.js';

function printUsage() {
  console.error('Usage: comparateur-extracteurs <fichier-reference.xlsx> <fichier-candidat.xlsx>');
  console.error('');
  console.error('Compare deux fichiers Excel (exports extracteur) et affiche les différences.');
  console.error('');
  console.error('Codes de sortie:');
  console.error('  0 = fichiers identiques');
  console.error('  1 = fichiers différents (différences affichées)');
  console.error('  2 = erreur (fichier introuvable, Excel invalide, etc.)');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    printUsage();
    process.exit(2);
  }
  
  const [refPath, candPath] = args;
  
  // Check files exist
  if (!fs.existsSync(refPath)) {
    console.error(`Erreur: Fichier de référence introuvable: ${refPath}`);
    process.exit(2);
  }
  
  if (!fs.existsSync(candPath)) {
    console.error(`Erreur: Fichier candidat introuvable: ${candPath}`);
    process.exit(2);
  }
  
  // Check files are .xlsx
  if (!refPath.endsWith('.xlsx')) {
    console.error(`Erreur: Le fichier de référence doit être un fichier .xlsx: ${refPath}`);
    process.exit(2);
  }
  
  if (!candPath.endsWith('.xlsx')) {
    console.error(`Erreur: Le fichier candidat doit être un fichier .xlsx: ${candPath}`);
    process.exit(2);
  }
  
  try {
    // Read and normalize both files
    const reference = readAndNormalizeExcel(refPath);
    const candidate = readAndNormalizeExcel(candPath);
    
    // Compare with numeric tolerance of 1e-6
    const result = compareExcelFiles(reference, candidate, 1e-6);
    
    // Print summary to stdout
    console.log(result.summary);
    
    // Exit with appropriate code
    if (result.identical) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error(`Erreur lors de la comparaison: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
}

main();
