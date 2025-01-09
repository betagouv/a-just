import path from "path";
import lineByLine from "n-readlines";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { csvToArrayJson } from "../utils/csv";
import {
  TAG_JURIDICTION_ID_COLUMN_NAME,
  TAG_JURIDICTION_VALUE_COLUMN_NAME,
} from "./constants/SDSE-ref";
import { get, groupBy, sumBy } from "lodash";
import YAML from "yaml";
import { XMLParser } from "fast-xml-parser";
import { onGetIelstListApi } from "./api/juridiction/juridiciton.api";
import { exit } from "process";

export default class App {
  constructor() { }

  async start() {
    console.log("--- START ---");

    const tmpFolder = path.join(__dirname, "../tmp");
    const inputFolder = path.join(__dirname, "../inputs");
    const outputFolder = path.join(__dirname, "../outputs");
    const outputAllFolder = path.join(__dirname, "../outputs_all");

    const categoriesOfRules = this.getRules(inputFolder);
    const referentiel = await this.getReferentiel(inputFolder);

    rmSync(tmpFolder, { recursive: true, force: true });
    mkdirSync(tmpFolder, { recursive: true });

    rmSync(outputFolder, { recursive: true, force: true });
    mkdirSync(outputFolder, { recursive: true });
    rmSync(outputAllFolder, { recursive: true, force: true });
    mkdirSync(outputAllFolder, { recursive: true });

    await onGetIelstListApi().then(async (response) => {
      //console.log('Categories of rules', categoriesOfRules);
      if (response) {
        // CIVIL
        // await this.getGroupByJuridiction(tmpFolder, inputFolder, response);
        // await this.formatAndGroupJuridiction(
        //   tmpFolder,
        //   outputFolder,
        //   outputAllFolder,
        //   categoriesOfRules,
        //   referentiel,
        //   response
        // );

        // WIP datas pénal
        // await this.getGroupByJuridictionPenal(tmpFolder, inputFolder, response);
        // await this.formatAndGroupJuridictionPenal(
        //   tmpFolder,
        //   outputFolder,
        //   outputAllFolder,
        //   categoriesOfRules,
        //   response
        // );


        // Data Cheking
        this.checkDataUsage(inputFolder, referentiel, categoriesOfRules)
      }
    });

    this.done();
  }

  done() {
    console.log("--- DONE ---");
    process.exit();
  }

  getRules(inputFolder) {
    const files = readdirSync(inputFolder).filter((f) => f.endsWith(".yml"));
    let categories = {};
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];

      const file = readFileSync(`${inputFolder}/${fileName}`, "utf8");
      const yamlParsed = YAML.parse(file);
      const type = yamlParsed.type
      categories[type] = (
          Object.values(yamlParsed.categories || []) 
      );
    }
    return categories;
  }

  async getJuridictionsValues(inputFolder) {
    const files = readdirSync(inputFolder).filter(
      (f) => f.endsWith(".xml") && f.indexOf("COMPTEURS") !== -1
    );
    const list = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      let liner = new lineByLine(`${inputFolder}/${file}`);
      let line;
      let lastId = null;

      // get header
      while ((line = liner.next()) !== false) {
        const lineFormated = line.toString("ascii").trim();
        const tagName = this.getTagName(lineFormated);
        const value = this.getTagValue(lineFormated);

        if (!lastId && tagName === TAG_JURIDICTION_ID_COLUMN_NAME) {
          lastId = value;
        } else if (lastId && tagName === TAG_JURIDICTION_VALUE_COLUMN_NAME) {
          list[lastId] = value;
          lastId = null;
        }
      }
    }

    return list;
  }

  getCsvOutputPath(tmpFolder, juridiction, type) {
    return `${tmpFolder}/export-activities-${juridiction}-${type}.csv`;
  }

  getCsvOutputPathPenal(tmpFolder, juridiction, type) {
    return `${tmpFolder}/export-activities-${juridiction}-${type}.csv`;
  }

  async getGroupByJuridiction(tmpFolder, inputFolder, I_ELST_LIST) {
    let groupedFiles = {} 
    
    groupedFiles.TGI_TI = readdirSync(inputFolder).filter(
      (f) => f.endsWith(".xml") && f.toLowerCase().indexOf("nomenc") === -1 && (f.indexOf('RGC-TGI') !== -1 || f.indexOf('RGC-TI') !== -1)
    );

    groupedFiles.CPH = readdirSync(inputFolder).filter(
      (f) => f.endsWith(".xml") && f.toLowerCase().indexOf("nomenc") === -1 && f.indexOf('RGC-CPH') !== -1
    );

    groupedFiles.MINTI = readdirSync(inputFolder).filter(
      (f) => f.endsWith(".xml") && f.toLowerCase().indexOf("nomenc") === -1 && f.indexOf('MINTI') !== -1
    );

    groupedFiles.CA = readdirSync(inputFolder).filter(
      (f) => f.endsWith(".xml") && f.toLowerCase().indexOf("nomenc") === -1 && f.indexOf('RGC-CA') !== -1
    );

    for (let type of Object.keys(groupedFiles)) {
      let headerMap = [];
      // generate header
      for (let i = 0; i < groupedFiles[type].length; i++) {
        const file = groupedFiles[type][i];

        let liner = new lineByLine(`${inputFolder}/${file}`);
        let line;
        let nbLine = 0;
        let secondTag = "";
        let isEnd = false;

        // get header
        while ((line = liner.next()) !== false && !isEnd) {
          const lineFormated = line.toString("ascii").trim();

          if (nbLine === 2) {
            secondTag = this.getTagName(lineFormated);
          } else if (`</${secondTag}>` === lineFormated) {
            isEnd = true;
          } else if (nbLine > 2) {
            const newTag = this.getTagName(lineFormated);
            // merge all columns name
            if (headerMap.indexOf(newTag) === -1) {
              headerMap.push(newTag);
            }
          }

          nbLine++;
        }
      }
      headerMap.push("type_juridiction");

      for (let i = 0; i < groupedFiles[type].length; i++) {
        const file = groupedFiles[type][i];

        const regex = new RegExp("(_RGC-(.*?)_)|(_MINTI_(.*?).xml)", "g");
        let testRegex;
        let getTypeOfJuridiction;
        if ((testRegex = regex.exec(file)) !== null) {
          getTypeOfJuridiction = testRegex[1];
        } else {
          break;
        }

        // complete file
        let liner = new lineByLine(`${inputFolder}/${file}`);
        let dataLines = headerMap.map(() => ""); // create empty map
        let totalLine = 0;
        let nbLine = 0;
        let line;
        let secondTag = "";
        while ((line = liner.next()) !== false) {
          const lineFormated = line.toString("ascii").trim();
          const tag = this.getTagName(lineFormated);

          if (nbLine === 2) {
            secondTag = this.getTagName(lineFormated);
          } else if (tag === secondTag) {
            secondTag = this.getTagName(lineFormated);
            dataLines = headerMap.map(() => ""); // create empty map
          } else if (`</${secondTag}>` === lineFormated) {
            // create file if not exist and only for authorizes jurdiction
            const juridiction = I_ELST_LIST[dataLines[0]];

            if (juridiction) {
              if (!existsSync(this.getCsvOutputPath(tmpFolder, juridiction, type))) {
                // create file
                writeFileSync(
                  this.getCsvOutputPath(tmpFolder, juridiction, type),
                  `${headerMap.join(",")},\n`
                );
              }

              dataLines[dataLines.length - 1] = getTypeOfJuridiction; // add type of juridiction
              appendFileSync(
                this.getCsvOutputPath(tmpFolder, juridiction, type),
                `${dataLines.join(",")},\n`
              );
              totalLine++;
            }
          } else if (nbLine > 2) {
            const index = headerMap.indexOf(tag);
            if (index !== -1) {
              dataLines[index] = this.getTagValue(lineFormated);
            }
          }

          nbLine++;
          if (nbLine % 1000000 === 0) {
            console.log(nbLine);
          }
        }
        console.log(`add ${totalLine} lines add`);
      }
    }
  }

  async getGroupByJuridictionPenal(tmpFolder, inputFolder, I_ELST_LIST) {
    const files = readdirSync(inputFolder).filter((f) => f.endsWith(".csv"));

    // generate header
    let header = null;
    let codeJuridiction = null;
    const ielstNames = ["tj", "tgi_code", "id_jur"];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      let liner = new lineByLine(`${inputFolder}/${file}`);
      let line = null;
      // get header
      line = liner.next();
      header = line.toString("ascii");
      //let getTypeOfJuridiction
      while ((line = liner.next().toString()) !== "false") {
        line = line.split(" ").join("");
        if (line.length > 0) {
          let lineFormated = "";
          const data = line.toString("ascii");
          lineFormated = header.concat("\n", data);
          const lineobject = await csvToArrayJson(lineFormated, "utf8").then(
            (res) => {
              return res[0];
            }
          );
          for (let ielst of ielstNames) {
            if (ielst in lineobject) {
              codeJuridiction = lineobject[ielst];
              break;
            }
          }
          if (codeJuridiction.length === 6)
            codeJuridiction = `00${codeJuridiction}`;
          const juridiction = I_ELST_LIST[codeJuridiction]
          if (juridiction) {
            const type = file.replace('.csv', '');
            if (
              !existsSync(
                this.getCsvOutputPathPenal(tmpFolder, juridiction, type)
              )
            ) {
              // create file
              writeFileSync(
                this.getCsvOutputPathPenal(
                  tmpFolder,
                  juridiction,
                  type
                ),
                header + "\n"
              );
            }
            appendFileSync(
              this.getCsvOutputPathPenal(tmpFolder, juridiction, type),
              `${data}\n`
            );
          }
        }
      }
    }
  }

  getTagName(stringNotFormated) {
    let tag = stringNotFormated.trim().split(">")[0].replace(/(<|>)/g, "");
    return tag.split(" ")[0];
  }

  getTagValue(stringNotFormated) {
    let tab = stringNotFormated.trim().split(">");
    if (tab.length > 1) {
      return tab[1].trim().split("<")[0];
    }
    return " ";
  }

  async formatAndGroupJuridiction(
    tmpFolder,
    outputFolder,
    outputAllFolder,
    categoriesOfRules,
    referentiel,
    I_ELST_LIST
  ) {
    const files = readdirSync(tmpFolder).filter((f) => f.endsWith(".csv"));
    const JURIDICTIONS_EXPORTS = {};
    const groupedFiles = files.reduce((acc, file) => {
      const ielst = file.match(/^export-activities-([^\-]+)-/);
      if (ielst) {
        const number = ielst[1]

        if (!acc[number]) {
          acc[number] = [];
        }
        acc[number].push(file);
      }
      return acc;
    }, {})

    // id, code_import, periode, stock, entrees, sorties
    // .....
    for( const tj in groupedFiles) {
      for (let i = 0; i < groupedFiles[tj].length; i++) {
        const fileName = groupedFiles[tj][i];

        const tj_label = fileName.replace(/^export-activities-/, '').replace(/-\w+\.csv$/, '');
        const ielst = Object.keys(I_ELST_LIST).find(key => I_ELST_LIST[key] === tj_label);
        const type = fileName.includes('CPH') ? 'CPH' : (fileName.includes('MINTI') ? 'MINTI' : fileName.includes('TGI_TI') ? 'TGI_TI' : 'CA');
        const rulesToApply = categoriesOfRules[type]
        if (!ielst) {
            continue
        }

        if (!JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]]) {
          JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]] = [];
        }

        console.log(
          fileName,
          fileName.replace(/^export-activities-/, '').replace(/-\w+\.csv$/, ''),
          I_ELST_LIST[ielst]
        );

        const arrayOfCsv = await csvToArrayJson(
          readFileSync(`${tmpFolder}/${fileName}`, "utf8"),
          {
            delimiter: ",",
          }
        );
        const groupByMonthObject = groupBy(arrayOfCsv, "periode");
        let list = [];
        Object.values(groupByMonthObject).map((monthValues) => {
          // format string to integer
          monthValues = monthValues.map((m) => ({
            ...m,
            nbaff: m.nbaff ? parseInt(m.nbaff) : null,
            nbaffdur: m.nbaffdur ? parseInt(m.nbaffdur) : null,
          }));

          const formatMonthDataFromRules = this.formatMonthFromRules(
            monthValues,
            rulesToApply,
            referentiel
          );
          //  -> Utile pour supprimer un mois spécifique sur les données
          const tmp = formatMonthDataFromRules.filter(elem => elem.periode !== '202412');
          list = list.concat(tmp);

          // list = list.concat(formatMonthDataFromRules);
        });

        // merge to existing list
        JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]] = list.reduce((acc, cur) => {
          const index = acc.findIndex(
            (a) => a.code_import === cur.code_import && a.periode === cur.periode
          );
          if (index === -1) {
            acc.push(cur);
          } else {
            let entrees = acc[index].entrees;
            if (cur.entrees !== null) {
              entrees = (entrees || 0) + (cur.entrees || 0);
            }

            let sorties = acc[index].sorties;
            if (cur.sorties !== null) {
              sorties = (sorties || 0) + (cur.sorties || 0);
            }

            let stock = acc[index].stock;
            if (cur.stock !== null) {
              stock = (stock || 0) + (cur.stock || 0);
            }

            acc[index] = {
              ...acc[index],
              entrees,
              sorties,
              stock,
            };
          }
          return acc;
        }, JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]]);
      }
    }

    for (const [key, value] of Object.entries(JURIDICTIONS_EXPORTS)) {
      writeFileSync(
        `${outputFolder}/${key}.csv`,
        `${["code_import,periode,entrees,sorties,stock,"]
          .concat(
            value.map(
              (l) =>
                `${l.code_import},${l.periode},${l.entrees},${l.sorties},${l.stock},`
            )
          )
          .join("\n")}`
      );
    }
    writeFileSync(
      `${outputAllFolder}/AllJuridictionsCiviles.csv`,
      "juridiction,code_import,periode,entrees,sorties,stock,\n"
    );

    for (const [key, value] of Object.entries(JURIDICTIONS_EXPORTS)) {
      appendFileSync(
        `${outputAllFolder}/AllJuridictionsCiviles.csv`,
        value
          .map(
            (l) =>
              `${key.replace(/[-_]/g, " ")},${l.code_import},${l.periode},${l.entrees
              },${l.sorties},${l.stock},\n`
          )
          .join("")
      );
    }
  }

  formatMonthFromRules(monthValues, categoriesOfRules, referentiel = []) {
    const list = {};

    categoriesOfRules.map((rule) => {
      rule["Code nomenclature"] = "" + rule["Code nomenclature"];
      if (!list[rule["Code nomenclature"]]) {
        list[rule["Code nomenclature"]] = {
          entrees: null,
          sorties: null,
          stock: null,
          periode: monthValues.length
            ? monthValues[0].periode ||
            monthValues[0].cod_moi ||
            monthValues[0].mois
            : null,
          code_import: rule["Code nomenclature"],
        };
      }
      if (
        rule.filtres /* &&
        list[rule["Code nomenclature"]].periode !== "202412" &&
        rule["Code nomenclature"] === "7.15."*/
      ) {
        const nodesToUse = ["entrees", "sorties", "stock"];
        for (let i = 0; i < nodesToUse.length; i++) {
          const node = nodesToUse[i];
          const newRules = rule.filtres[node];
          // control if node exist
          if (newRules && newRules !== "-") {
            let lines = monthValues;

            // EXCLUDES INCLUDES QUERIES
            Object.keys(newRules)
              .filter((r) => r !== "TOTAL")
              .map((ruleKey) => {
                lines = this.filterDatasByNomenc(
                  newRules,
                  lines,
                  ruleKey,
                  referentiel
                );
              });

            // save values
            const totalKeyNode = (newRules.TOTAL || "").toLowerCase();
            //const sumByValues = sumBy(lines, totalKeyNode);
            let sumByValues = 0
            for (let line of lines) {
              if (typeof line[totalKeyNode] === Number)
                sumByValues += line[totalKeyNode]
              else (typeof line[totalKeyNode] === String)
                sumByValues += Number(line[totalKeyNode])
            }
            /*console.log(
              node,
              sumByValues,
              lines.map((l) => l[totalKeyNode]),
              rule["Code nomenclature"],
              list[rule["Code nomenclature"]].periode
            );*/

            list[rule["Code nomenclature"]][node] =
              (list[rule["Code nomenclature"]][node] || 0) + (sumByValues || 0);
          } else if (newRules === 0) list[rule["Code nomenclature"]][node] = 0;
          else if (newRules === "-") {
            // A SUPPRIMER APRES IMPORT DATA AVRIL 2023
            list[rule["Code nomenclature"]][node] = null;
          }
        }
      }
    });

    return Object.values(list);
  }

  filterDatasByNomenc(rules, lines, node, referentiel) {
    let nodeValues = rules[node];
    let include = true;
    let listCodeToFind = [];

    if (typeof nodeValues === "undefined") {
      return lines;
    }
    // force to read array of string or number
    if (typeof nodeValues === "string" || typeof nodeValues === "number") {
      nodeValues = [nodeValues];
    }
    nodeValues.map((value) => {
      value = ("" + value).trim(); // clean string
      let label = value;

      if (label.startsWith("<>") === true) {
        //label = label.replace("<>", "").trim().slice(1, -1);
        label = label.replace(/[<>"]/g, '').trim()
        include = false; // warning need to be alway same
      }

      const findRefList = referentiel.filter(
        (r) => r.LIBELLE === label && r.TYPE_NOMENC === node
      );
      let codeList = findRefList.map((f) => f.CODE);
      if (codeList.length === 0) {
        // if no code finded then find by label
        codeList = [label];
      }

      listCodeToFind = listCodeToFind.concat(codeList);
    });
    if (include) {
      lines = lines.filter(
        (m) => listCodeToFind.indexOf(m[node.toLowerCase()]) !== -1
      );
    } else {
      lines = lines.filter(
        (m) => listCodeToFind.indexOf(m[node.toLowerCase()]) === -1
      );
    }

    return lines;
  }

  async getReferentiel(inputFolder) {
    const referentielFiles = readdirSync(inputFolder).filter(
      (f) => f.endsWith(".xml") && f.toLowerCase().indexOf("nomenc") !== -1
    );
    let list = [];

    if (referentielFiles) {
      for (let i = 0; i < referentielFiles.length; i++) {
        const file = referentielFiles[i];

        const parser = new XMLParser();
        const xml = parser.parse(
          readFileSync(`${inputFolder}/${file}`, { encoding: "utf8" })
        );

        list = list.concat(xml.ROWSET.ROW);
      }
    }
    return list;
  }

  async formatAndGroupJuridictionPenal(
    tmpFolder,
    outputFolder,
    outputAllFolder,
    categoriesOfRules,
    I_ELST_LIST
  ) {
    const files = readdirSync(tmpFolder).filter((f) => f.endsWith(".csv"));
    const JURIDICTIONS_EXPORTS = {};
    const groupedFiles = files.reduce((acc, file) => {
      const ielst = file.match(/^export-activities-([^\-]+)-/);
      
      if (ielst) {
        const number = ielst[1]

        if (!acc[number]) {
          acc[number] = [];
        }
        acc[number].push(file);
      }
      return acc;
    }, {})

    for( const tj in groupedFiles) {
      for (let i = 0; i < groupedFiles[tj].length; i++) {
        const fileName =  groupedFiles[tj][i];
        
        const tj_label = fileName.replace(/^export-activities-/, '').replace(/-\w+\.csv$/, '');
        const ielst = Object.keys(I_ELST_LIST).find(key => I_ELST_LIST[key] === tj_label);
        const type = 'Penal';
        const rules = categoriesOfRules[type]
        const rulesToApply = rules.filter((rule) => {
          return fileName.includes(rule.fichier);
        });

        if (!ielst) {
          continue
        }

        if (!JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]]) {
          JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]] = [];
        }

        const arrayOfCsv = await csvToArrayJson(
          readFileSync(`${tmpFolder}/${fileName}`, "utf8")
        );
        
        let dateInfo = null;
        if (arrayOfCsv.length) {
          const header = Object.keys(arrayOfCsv[0]);
          const dateColumns = ['cod_moi', 'annee', 'mois'];

          const foundDateColumns = dateColumns.filter(col => header.includes(col));

          if (foundDateColumns.length) {
            if (foundDateColumns.includes('cod_moi')) {
              dateInfo = 'cod_moi';
            } else if (foundDateColumns.includes('mois')) {
              dateInfo = foundDateColumns.includes('annee') ? ['annee', 'mois'] : 'mois';
            } else {
              dateInfo = ['annee']; // Cas où seule 'annee' est présente
            }
          }
        }

        // group by month
        let groupByMonthObject = null;
        let arrayOfCsv_copy = null
        if (!Array.isArray(dateInfo)) {
          arrayOfCsv_copy = arrayOfCsv.map((values) => {
            const periode = values[dateInfo]
            delete values[dateInfo]
            return { ...values, periode: periode }
          })
        } else {
          arrayOfCsv_copy = arrayOfCsv.map((values) => {
            const mois =
              values.mois.length < 2 ? values.annee + `0${values.mois}` : values.annee + values.mois;
            delete values.annee;
            delete values.mois;
            return { ...values, periode: mois };
          });
        }

        groupByMonthObject = groupBy(arrayOfCsv_copy, 'periode');

        let list = [];
        const entreeNames = ["nb_aff_nouv", "instr_nb_aff_nouv"];
        const sortieNames = ["nb_aff_end", "instr_nb_aff_cloturee", "nb_aff"];
        const stockNames = ["nb_aff_old", "instr_nb_aff_stock"];
        Object.values(groupByMonthObject).map((monthValues) => {
          // format string to integer

          monthValues = monthValues.map((values) => {
            for (let entree of entreeNames) {
              if (entree in values) {
                values[entree] = values[entree] ? parseInt(values[entree]) : null;
                break;
              }
            }
            for (let sortie of sortieNames) {
              if (sortie in values) {
                values[sortie] = values[sortie] ? parseInt(values[sortie]) : null;
                break;
              }
            }
            for (let stock of stockNames) {
              if (stock in values) {
                values[stock] = values[stock] ? parseInt(values[stock]) : null;
                break;
              }
            }

            return values;
          });
          const now = new Date()
          now.setDate(1)

          const year = parseInt(monthValues[0].periode.substring(0, 4), 10);
          const month = parseInt(monthValues[0].periode.substring(4, 6), 10) - 1;
          const periode = new Date(year, month, 1);
          
          const previousMonth = new Date(now);
          previousMonth.setMonth(now.getMonth() - 1);
        

          if (periode <= previousMonth) {
            let formatMonthDataFromRules = null;
            formatMonthDataFromRules = this.formatMonthFromRules(
              monthValues,
              rulesToApply
            );
            list = list.concat(formatMonthDataFromRules);
          }
        });

        // merge to existing list
        JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]] = list.reduce((acc, cur) => {
          const index = acc.findIndex(
            (a) => a.code_import === cur.code_import && a.periode === cur.periode
          );
          if (index === -1) {
            acc.push(cur);
          } else {
            let entrees = acc[index].entrees;
            if (cur.entrees !== null) {
              entrees = (entrees || 0) + (cur.entrees || 0);
            }

            let sorties = acc[index].sorties;
            if (cur.sorties !== null) {
              sorties = (sorties || 0) + (cur.sorties || 0);
            }

            let stock = acc[index].stock;
            if (cur.stock !== null) {
              stock = (stock || 0) + (cur.stock || 0);
            }

            acc[index] = {
              ...acc[index],
              entrees,
              sorties,
              stock,
            };
          }

          return acc;
        }, JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]]);
      }
    }

    for (const [key, value] of Object.entries(JURIDICTIONS_EXPORTS)) {
      writeFileSync(
        `${outputFolder}/${key}.csv`,
        `${["code_import,periode,entrees,sorties,stock,"]
          .concat(
            value.map(
              (l) =>
                `${l.code_import},${l.periode},${l.entrees},${l.sorties},${l.stock},`
            )
          )
          .join("\n")}`
      );
    }

    writeFileSync(
      `${outputAllFolder}/AllJuridictionsPenal.csv`,
      "juridiction,code_import,periode,entrees,sorties,stock,\n"
    );

    for (const [key, value] of Object.entries(JURIDICTIONS_EXPORTS)) {
      appendFileSync(
        `${outputAllFolder}/AllJuridictionsPenal.csv`,
        value
          .map(
            (l) =>
              `${key.replace(/[-_]/g, " ")},${l.code_import},${l.periode},${l.entrees
              },${l.sorties},${l.stock},\n`
          )
          .join("")
      );
    }
  }

  getKeysToConsider(rules) {
    const keys = []
    rules.map(rule => {
      if (rule.filtres) {
        Object.keys(rule.filtres).map(type => {
          Object.keys(rule.filtres[type]).map(key => {
            if (key !== 'TOTAL' && keys.indexOf(key) === -1) {
              keys.push(key)
            }
          })
        })
      }
    })

    return keys
  }

  checkDataUsage(inputFolder, referentiel, categoriesOfRules) {
    // Récupération des fichiers de données
    const dataFiles = readdirSync(inputFolder).filter((f) => f.endsWith(".xml") && f.toLowerCase().indexOf("nomenc") === -1)

    // Récupération de l'ensemble des règles
    const rules = Object.values(categoriesOfRules).flat()

    //On récupère seuelemnt les filtres qui nous inéressent pour gagner du temps sur la suite
    const keysToConsider = this.getKeysToConsider(rules)

    console.log('keysToConsider:', keysToConsider)

    // console.log('rules:', rules)

    if (dataFiles) {
      //for (let i = 0; i < dataFiles.length; i++) {
        const file = dataFiles[0];
        console.log('\n\nFile:', file)
        const parser = new XMLParser();
        const xml = parser.parse(
          readFileSync(`${inputFolder}/${file}`, { encoding: "utf8" })
        );
      
        if (xml.ROWSET.ROW) {
          xml.ROWSET.ROW.map(data => {
            console.log('\n\n\n\nData:', data)
            rules.map(rule => {
              console.log('\nNew Rule')
              if (rule.filtres) {
                // type = entrees || sorties || stock
                Object.keys(rule.filtres).map(type => {
                  // On supprime la clé TOTAL qui ne nous intéresse pas
                  if (rule.filtres[type].TOTAL) {
                      delete rule.filtres[type].TOTAL
                  }

                  Object.keys(rule.filtres[type]).map(key => {
                    //console.log('key:', key)
                    if (key in data) {
                      //console.log('data[key]:', data[key])
                      
                      const filter = Array.isArray(rule.filtres[type][key]) ? rule.filtres[type][key] : [rule.filtres[type][key]]
                      
                      // On récupère les codes correspondant aux libellés dans la nomenclature
                      let codes = referentiel.filter(r => filter.includes(r.LIBELLE)).map(r => r.CODE)
                     
                      console.log('filter:', filter)
                      console.log('codes:', codes)
                    }
                  })
                })
              }

            })


          //   Object.keys(data).map(dataKey => {
          //     // On prend en compte uniquement les clés qui sont utilisées dans les règles
          //     if (keysToConsider.indexOf(dataKey) !== -1) {
          //       console.log('dataKey:', dataKey)
          //       // On applique chaque règles à cette ligne de donnée pour voir si elle correspond à une règle ou plus
          //       rules.map(rule => {
          //         if (rule.filtres) {
          //           // type = entrees || sorties || stock
          //           Object.keys(rule.filtres).map(type => {
          //             const filtres = rule.filtres[type]

          //             if (rule.filtres[type].TOTAL) {
          //                 delete rule.filtres[type].TOTAL
          //             }

          //             console.log('rule.filtres[type]:', rule.filtres[type])
          //             Object.keys(rule.filtres[type]).map(key => {
          //               if (key === dataKey){
          //                 console.log('dataKey:', dataKey)
          //                 console.log('key:', key)
          //               }
          //             })
          //           })
          //         }
          //       })
          //     }
          // })
        })
     }
    }

  }
}
