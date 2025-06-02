import assert from 'node:assert/strict';
import deepEqual from 'fast-deep-equal'; // npm install fast-deep-equal
import fs from 'fs';
import { computeExtract, computeExtractv2 } from './extractor.js';

/**
 * Test de non-régression entre deux versions de `computeExtract`.
 */
export async function testComputeExtractNonRegression(params) {
  console.time('non-regression-test');

  const oldResult = await computeExtract({ ...params });
  const newResult = await computeExtractv2({ ...params });

  let allEqual = true;
  let differences = [];

  if (oldResult.length !== newResult.length) {
    console.error(`❌ Nombre d'éléments différents : ${oldResult.length} vs ${newResult.length}`);
    allEqual = false;
  }

  for (let i = 0; i < Math.min(oldResult.length, newResult.length); i++) {
    const oldItem = oldResult[i];
    const newItem = newResult[i];

    if (!deepEqual(oldItem, newItem)) {
      allEqual = false;
      differences.push({
        index: i,
        id: oldItem["Réf."] || newItem["Réf."],
        old: oldItem,
        new: newItem,
      });
    }
  }

  if (!allEqual) {
    console.error(`❌ ${differences.length} différences trouvées !`);
    fs.writeFileSync(
      './computeExtract-differences.json',
      JSON.stringify(differences, null, 2),
      'utf-8'
    );
    throw new Error('Non-régression échouée ! Différences enregistrées dans computeExtract-differences.json');
  }

  console.log('✅ Test de non-régression réussi. Les deux versions donnent des résultats identiques.');
}
