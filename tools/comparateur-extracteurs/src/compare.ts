/**
 * Excel comparison logic for extracteur exports
 * Compares two Excel files with detailed diff including:
 * - Cell values (with numeric tolerance)
 * - Formulas
 * - Number formats
 * - Cell types
 * - Styles (font, fill, borders, alignment)
 * - Data validation (dropdowns)
 */

import * as xlsx from 'xlsx';
import * as fs from 'fs';

export interface CellData {
  v?: any;           // Value
  f?: string;        // Formula
  z?: string;        // Number format
  t?: string;        // Cell type (n=number, s=string, b=boolean, e=error, d=date)
  style?: CellStyle;
  dv?: DataValidation;
}

export interface CellStyle {
  font?: {
    name?: string;
    size?: number | string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
  };
  fill?: {
    fgColor?: string;
    bgColor?: string;
    patternType?: string;
  };
  border?: any;
  alignment?: {
    horizontal?: string;
    vertical?: string;
    wrapText?: boolean;
  };
}

export interface DataValidation {
  type?: string;
  formula1?: string;
  formula2?: string;
  operator?: string;
  allowBlank?: boolean;
  showDropDown?: boolean;
}

export interface SheetDiff {
  sheet: string;
  cell: string;
  reference: string;
  new: string;
}

export interface ComparisonResult {
  diffs: SheetDiff[];
  summary: string;
  identical: boolean;
}

/**
 * Read and normalize an Excel file to a comparable JSON structure
 */
export function readAndNormalizeExcel(filePath: string): any {
  const wb = xlsx.readFile(filePath, { 
    cellDates: false, 
    cellNF: true, 
    cellFormula: true, 
    cellStyles: true 
  });
  
  const out: any = { sheets: {} };
  
  const getCellAddress = (r: number, c: number): string => {
    return xlsx.utils.encode_cell({ r, c });
  };
  
  const trimMatrix = (rows: any[][]): any[][] => {
    let maxR = -1, maxC = -1;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      for (let c = 0; c < row.length; c++) {
        const v = row[c];
        if (v !== null && v !== undefined && v !== '') {
          const hasContent = (typeof v === 'object' && (v.v !== undefined || v.f !== undefined)) || 
                            (typeof v !== 'object' && String(v).trim() !== '');
          if (hasContent) {
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
          }
        }
      }
    }
    if (maxR === -1 || maxC === -1) return [];
    return rows.slice(0, maxR + 1).map((row) => (row || []).slice(0, maxC + 1));
  };
  
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const range = xlsx.utils.decode_range(ws['!ref'] || 'A1');
    const rows: any[][] = [];
    
    // Extract data validation rules (dropdowns)
    const dataValidations: any = {};
    if (ws['!dataValidation']) {
      ws['!dataValidation'].forEach((dv: any) => {
        if (dv.sqref) {
          const key = String(dv.sqref);
          dataValidations[key] = {
            type: dv.type || '',
            formula1: dv.formula1 || '',
            formula2: dv.formula2 || '',
            operator: dv.operator || '',
            allowBlank: dv.allowBlank,
            showDropDown: dv.showDropDown
          };
        }
      });
    }
    
    // Extract cell data with formulas, formats, styles, and validation
    for (let r = range.s.r; r <= range.e.r; r++) {
      const row: any[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddr = getCellAddress(r, c);
        const cell = ws[cellAddr];
        
        if (!cell) {
          row.push('');
          continue;
        }
        
        // Build comprehensive cell data
        const cellData: any = {};
        
        // Value (displayed)
        if (cell.v !== undefined) {
          if (typeof cell.v === 'number') {
            cellData.v = Number(cell.v);
          } else {
            cellData.v = String(cell.v).trim();
          }
        }
        
        // Formula
        if (cell.f) {
          cellData.f = String(cell.f);
        }
        
        // Number format
        if (cell.z) {
          cellData.z = String(cell.z);
        }
        
        // Cell type (n=number, s=string, b=boolean, e=error, d=date)
        if (cell.t) {
          cellData.t = String(cell.t);
        }
        
        // Cell style (font, fill, border, alignment)
        if (cell.s) {
          const style: any = {};
          
          // Font properties
          if (cell.s.font) {
            style.font = {
              name: cell.s.font.name || '',
              size: cell.s.font.sz || cell.s.font.size || '',
              bold: cell.s.font.bold || false,
              italic: cell.s.font.italic || false,
              underline: cell.s.font.underline || false,
              color: cell.s.font.color ? (cell.s.font.color.rgb || cell.s.font.color.theme || '') : ''
            };
          }
          
          // Fill/background color
          if (cell.s.fill) {
            style.fill = {
              fgColor: cell.s.fill.fgColor ? (cell.s.fill.fgColor.rgb || cell.s.fill.fgColor.theme || '') : '',
              bgColor: cell.s.fill.bgColor ? (cell.s.fill.bgColor.rgb || cell.s.fill.bgColor.theme || '') : '',
              patternType: cell.s.fill.patternType || ''
            };
          }
          
          // Border
          if (cell.s.border) {
            style.border = {
              top: cell.s.border.top ? { style: cell.s.border.top.style || '', color: cell.s.border.top.color || '' } : null,
              bottom: cell.s.border.bottom ? { style: cell.s.border.bottom.style || '', color: cell.s.border.bottom.color || '' } : null,
              left: cell.s.border.left ? { style: cell.s.border.left.style || '', color: cell.s.border.left.color || '' } : null,
              right: cell.s.border.right ? { style: cell.s.border.right.style || '', color: cell.s.border.right.color || '' } : null
            };
          }
          
          // Alignment
          if (cell.s.alignment) {
            style.alignment = {
              horizontal: cell.s.alignment.horizontal || '',
              vertical: cell.s.alignment.vertical || '',
              wrapText: cell.s.alignment.wrapText || false
            };
          }
          
          if (Object.keys(style).length > 0) {
            cellData.style = style;
          }
        }
        
        // Data validation (dropdown)
        const validationKey = Object.keys(dataValidations).find(key => {
          try {
            const decoded = xlsx.utils.decode_range(key);
            return r >= decoded.s.r && r <= decoded.e.r && c >= decoded.s.c && c <= decoded.e.c;
          } catch {
            return false;
          }
        });
        if (validationKey) {
          cellData.dv = dataValidations[validationKey];
        }
        
        // If only value exists and it's simple, store it directly for backward compatibility
        if (Object.keys(cellData).length === 1 && cellData.v !== undefined) {
          row.push(cellData.v);
        } else if (Object.keys(cellData).length === 0) {
          row.push('');
        } else {
          row.push(cellData);
        }
      }
      rows.push(row);
    }
    
    out.sheets[sheetName] = trimMatrix(rows);
  }
  
  return out;
}

/**
 * Convert column index to Excel letter (0 -> A, 1 -> B, 25 -> Z, 26 -> AA, etc.)
 */
function colToExcel(col: number): string {
  let result = '';
  let c = col;
  while (c >= 0) {
    result = String.fromCharCode(65 + (c % 26)) + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
}

/**
 * Convert row/col to Excel notation (e.g., row=0, col=1 -> "B1")
 */
function cellToExcel(row: number, col: number): string {
  return `${colToExcel(col)}${row + 1}`;
}

/**
 * Extract cell properties (handles both simple values and complex cell objects)
 */
function getCellProps(cell: any): CellData {
  if (cell === null || cell === undefined || cell === '') {
    return { v: '', f: undefined, z: undefined, t: undefined, style: undefined, dv: undefined };
  }
  if (typeof cell === 'object' && !Array.isArray(cell)) {
    return {
      v: cell.v ?? '',
      f: cell.f,
      z: cell.z,
      t: cell.t,
      style: cell.style,
      dv: cell.dv
    };
  }
  // Simple value (backward compatibility)
  return { v: cell, f: undefined, z: undefined, t: undefined, style: undefined, dv: undefined };
}

/**
 * Compare two normalized Excel structures with tolerance for numeric values
 */
export function compareExcelFiles(reference: any, candidate: any, eps = 1e-6): ComparisonResult {
  const allDiffs: SheetDiff[] = [];
  const sheetsRef = Object.keys((reference && reference.sheets) || {});
  const sheetsCand = Object.keys((candidate && candidate.sheets) || {});
  const allSheetNames = Array.from(new Set([...sheetsRef, ...sheetsCand]));
  
  allSheetNames.forEach((sheetName) => {
    const refSheet: any[][] = (reference && reference.sheets && reference.sheets[sheetName]) || [];
    const candSheet: any[][] = (candidate && candidate.sheets && candidate.sheets[sheetName]) || [];
    const maxR = Math.max(refSheet.length, candSheet.length);
    
    for (let r = 0; r < maxR; r++) {
      const refRow = refSheet[r] || [];
      const candRow = candSheet[r] || [];
      const maxC = Math.max(refRow.length, candRow.length);
      
      for (let c = 0; c < maxC; c++) {
        const refCell = getCellProps(refRow[c]);
        const candCell = getCellProps(candRow[c]);
        
        const differences: string[] = [];
        
        // Compare values
        const refIsNum = typeof refCell.v === 'number';
        const candIsNum = typeof candCell.v === 'number';
        if (refIsNum || candIsNum) {
          const nRef = Number(refCell.v);
          const nCand = Number(candCell.v);
          if (!(Number.isFinite(nRef) && Number.isFinite(nCand) && Math.abs(nRef - nCand) <= eps)) {
            differences.push(`Valeur : ${refCell.v} → ${candCell.v}`);
          }
        } else {
          const refStr = String(refCell.v ?? '').trim();
          const candStr = String(candCell.v ?? '').trim();
          if (refStr !== candStr) {
            differences.push(`Valeur : "${refStr}" → "${candStr}"`);
          }
        }
        
        // Compare formulas
        const refFormula = refCell.f || '';
        const candFormula = candCell.f || '';
        if (refFormula !== candFormula) {
          differences.push(`Formule : "${refFormula}" → "${candFormula}"`);
        }
        
        // Compare number formats
        const refFormat = refCell.z || '';
        const candFormat = candCell.z || '';
        if (refFormat !== candFormat) {
          differences.push(`Format : "${refFormat}" → "${candFormat}"`);
        }
        
        // Compare cell types
        const refType = refCell.t || '';
        const candType = candCell.t || '';
        if (refType !== candType) {
          const typeNames: any = { n: 'nombre', s: 'texte', b: 'booléen', e: 'erreur', d: 'date' };
          const refTypeName = typeNames[refType] || refType;
          const candTypeName = typeNames[candType] || candType;
          differences.push(`Type : ${refTypeName} → ${candTypeName}`);
        }
        
        // Compare styles (font, fill, border, alignment)
        const refStyle = refCell.style;
        const candStyle = candCell.style;
        if (refStyle || candStyle) {
          const refStyleStr = JSON.stringify(refStyle || {});
          const candStyleStr = JSON.stringify(candStyle || {});
          if (refStyleStr !== candStyleStr) {
            // Detailed style comparison
            const styleDiffs: string[] = [];
            
            // Font comparison
            if (refStyle?.font || candStyle?.font) {
              const refFont = refStyle?.font || {};
              const candFont = candStyle?.font || {};
              const fontChanges: string[] = [];
              if (refFont.size !== candFont.size) fontChanges.push(`taille ${refFont.size || ''}→${candFont.size || ''}`);
              if (refFont.bold !== candFont.bold) fontChanges.push(candFont.bold ? 'gras ajouté' : 'gras retiré');
              if (refFont.italic !== candFont.italic) fontChanges.push(candFont.italic ? 'italique ajouté' : 'italique retiré');
              if (refFont.underline !== candFont.underline) fontChanges.push(candFont.underline ? 'souligné ajouté' : 'souligné retiré');
              if (refFont.color !== candFont.color) fontChanges.push(`couleur ${refFont.color || 'aucune'}→${candFont.color || 'aucune'}`);
              if (refFont.name !== candFont.name) fontChanges.push(`police ${refFont.name || ''}→${candFont.name || ''}`);
              if (fontChanges.length > 0) {
                styleDiffs.push(`Police : ${fontChanges.join(', ')}`);
              }
            }
            
            // Fill comparison
            if (refStyle?.fill || candStyle?.fill) {
              const refFill = refStyle?.fill || {};
              const candFill = candStyle?.fill || {};
              const fillChanges: string[] = [];
              if (refFill.fgColor !== candFill.fgColor) fillChanges.push(`fond ${refFill.fgColor || 'aucun'}→${candFill.fgColor || 'aucun'}`);
              if (fillChanges.length > 0) {
                styleDiffs.push(`Remplissage : ${fillChanges.join(', ')}`);
              }
            }
            
            if (styleDiffs.length > 0) {
              differences.push(...styleDiffs);
            }
          }
        }
        
        // Compare data validation (dropdowns)
        const refDv = refCell.dv;
        const candDv = candCell.dv;
        if (refDv || candDv) {
          const refDvStr = JSON.stringify(refDv || {});
          const candDvStr = JSON.stringify(candDv || {});
          if (refDvStr !== candDvStr) {
            // Extract dropdown options for readable comparison
            const refFormula = refDv?.formula1 || '';
            const candFormula = candDv?.formula1 || '';
            if (refFormula !== candFormula) {
              // Clean up formula display (remove quotes and escape characters)
              const cleanFormula = (f: string) => f.replace(/^"|"$/g, '').replace(/\\"/g, '"');
              differences.push(`Menu déroulant : ${cleanFormula(refFormula)} → ${cleanFormula(candFormula)}`);
            } else {
              // Other validation changes
              differences.push(`Menu déroulant : configuration modifiée`);
            }
          }
        }
        
        if (differences.length > 0) {
          allDiffs.push({
            sheet: sheetName,
            cell: cellToExcel(r, c),
            reference: differences.map(d => d.split(' → ')[0].split(': ')[1]).join(', '),
            new: differences.join('; ')
          });
        }
      }
    }
  });
  
  // Build structured summary grouped by sheet
  const diffsBySheet = new Map<string, SheetDiff[]>();
  allDiffs.forEach(diff => {
    if (!diffsBySheet.has(diff.sheet)) {
      diffsBySheet.set(diff.sheet, []);
    }
    diffsBySheet.get(diff.sheet)!.push(diff);
  });
  
  let summary = '';
  if (allDiffs.length > 0) {
    summary = `Trouvé ${allDiffs.length} différence(s) dans ${diffsBySheet.size} feuille(s) :\n\n`;
    
    diffsBySheet.forEach((diffs, sheetName) => {
      summary += `Feuille : "${sheetName}" (${diffs.length} différence(s))\n`;
      summary += '='.repeat(60) + '\n';
      
      diffs.forEach(diff => {
        summary += `  Cellule ${diff.cell} :\n`;
        summary += `    ${diff.new}\n`;
        summary += '\n';
      });
      
      summary += '\n';
    });
  } else {
    summary = 'Aucune différence trouvée. Les fichiers sont identiques.\n';
  }
  
  return { 
    diffs: allDiffs, 
    summary,
    identical: allDiffs.length === 0
  };
}
