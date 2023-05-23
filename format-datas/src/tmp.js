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
  I_ELST_LIST,
  TAG_JURIDICTION_ID_COLUMN_NAME,
  TAG_JURIDICTION_VALUE_COLUMN_NAME,
} from "./constants/SDSE-ref";
import { groupBy, sumBy } from "lodash";
import YAML from "yaml";
import { XMLParser } from "fast-xml-parser";

export default class App {
  constructor() {}

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

    //await this.getGroupByJuridiction(tmpFolder, inputFolder)
    //await this.formatAndGroupJuridiction(tmpFolder,outputFolder,outputAllFolder,categoriesOfRules,referentiel)

    // WIP datas pénal
    await this.getGroupByJuridictionPenal(tmpFolder, inputFolder);
    await this.formatAndGroupJuridictionPenal(
      tmpFolder,
      outputFolder,
      outputAllFolder,
      categoriesOfRules
    );

    this.done();
  }

  done() {
    console.log("--- DONE ---");
    process.exit();
  }

  getRules(inputFolder) {
    const files = readdirSync(inputFolder).filter((f) => f.endsWith(".yml"));
    let categories = [];

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];

      const file = readFileSync(`${inputFolder}/${fileName}`, "utf8");
      const yamlParsed = YAML.parse(file);
      categories = categories.concat(
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

  getCsvOutputPath(tmpFolder, juridiction) {
    return `${tmpFolder}/export-activities-${juridiction}.csv`;
  }

  getCsvOutputPathPenal(inputFileName, tmpFolder, juridiction) {
    return `${tmpFolder}/${inputFileName}-export-activities-${juridiction}.csv`;
  }

  async getGroupByJuridiction(tmpFolder, inputFolder) {
    const files = readdirSync(inputFolder).filter(
      (f) => f.endsWith(".xml") && f.toLowerCase().indexOf("nomenc") === -1
    );

    let headerMap = [];
    // generate header
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const regex = new RegExp("_RGC-(.*?)_", "g");
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
          const codeJuridiction = dataLines[0];

          if (!existsSync(this.getCsvOutputPath(tmpFolder, codeJuridiction))) {
            // create file
            writeFileSync(
              this.getCsvOutputPath(tmpFolder, codeJuridiction),
              `${headerMap.join(",")},\n`
            );
          }

          dataLines[dataLines.length - 1] = getTypeOfJuridiction; // add type of juridiction

          appendFileSync(
            this.getCsvOutputPath(tmpFolder, codeJuridiction),
            `${dataLines.join(",")},\n`
          );
          totalLine++;
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

  async getGroupByJuridictionPenal(tmpFolder, inputFolder) {
    const files = readdirSync(inputFolder).filter((f) => f.endsWith(".csv"));
    console.log("FILES:", files);
    // generate header
    let header = null;
    let codeJuridiction = null;
    const ielstNames = ["tj", "tgi_code", "id_jur"];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log("File:", file);
      let liner = new lineByLine(`${inputFolder}/${file}`);
      let line = null;
      // get header
      line = liner.next();
      header = line.toString("ascii");
      //let getTypeOfJuridiction
      while ((line = liner.next()) !== false) {
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
        if (I_ELST_LIST[codeJuridiction]) {
          const fileName = file.replace(".csv", "");
          if (
            !existsSync(
              this.getCsvOutputPathPenal(fileName, tmpFolder, codeJuridiction)
            )
          ) {
            // create file
            writeFileSync(
              this.getCsvOutputPathPenal(fileName, tmpFolder, codeJuridiction),
              header + "\n"
            );
          }
          appendFileSync(
            this.getCsvOutputPathPenal(fileName, tmpFolder, codeJuridiction),
            `${data}\n`
          );
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
    referentiel
  ) {
    const files = readdirSync(tmpFolder).filter((f) => f.endsWith(".csv"));
    const JURIDICTIONS_EXPORTS = {};

    // id, code_import, periode, stock, entrees, sorties
    // .....

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const ielst = fileName
        .replace("export-activities-", "")
        .replace(".csv", "");

      if (!I_ELST_LIST[ielst]) {
        continue;
      }

      if (!JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]]) {
        JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]] = [];
      }

      console.log(
        fileName,
        fileName.replace("export-activities-", "").replace(".csv", ""),
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

        console.log(ielst);
        const formatMonthDataFromRules = this.formatMonthFromRules(
          monthValues,
          categoriesOfRules,
          referentiel
        );
        list = list.concat(formatMonthDataFromRules);
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
              `${key.replace(/[-_]/g, " ")},${l.code_import},${l.periode},${
                l.entrees
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
        rule.filtres /* && list[rule['Code nomenclature']].periode === '202101' && rule['Code nomenclature'] === '7.7.'*/
      ) {
        const nodesToUse = ["entrees", "sorties", "stock"];
        for (let i = 0; i < nodesToUse.length; i++) {
          const node = nodesToUse[i];
          const newRules = rule.filtres[node];
          // control il node exist
          if (newRules) {
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
            const sumByValues = sumBy(lines, totalKeyNode);
            console.log(
              node,
              sumByValues,
              lines.map((l) => l[totalKeyNode]),
              rule["Code nomenclature"],
              list[rule["Code nomenclature"]].periode
            );

            list[rule["Code nomenclature"]][node] =
              (list[rule["Code nomenclature"]][node] || 0) + (sumByValues || 0);
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
    // force to read array of string of number
    if (typeof nodeValues === "string" || typeof nodeValues === "number") {
      nodeValues = [nodeValues];
    }
    nodeValues.map((value) => {
      value = ("" + value).trim(); // clean string
      let label = value;

      if (label.startsWith("<>") === true) {
        label = label.replace("<>", "").trim().slice(1, -1);
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
    categoriesOfRules
  ) {
    const files = readdirSync(tmpFolder).filter((f) => f.endsWith(".csv"));
    const JURIDICTIONS_EXPORTS = {};

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i].replace(/-export-activities-.*/, "");

      let ielst = files[i]
        .replace(/.+?(?=export-activities-)/, "")
        .replace("export-activities-", "")
        .replace(".csv", "");

      if (!I_ELST_LIST[ielst]) {
        continue;
      }

      if (!JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]]) {
        JURIDICTIONS_EXPORTS[I_ELST_LIST[ielst]] = [];
      }

      const arrayOfCsv = await csvToArrayJson(
        readFileSync(`${tmpFolder}/${files[i]}`, "utf8")
      );

      const tmpCategoriesOfRules = categoriesOfRules.filter((rule) => {
        return fileName.includes(rule.fichier);
      });
      console.log("tmpCategoriesOfRules:", tmpCategoriesOfRules);

      //let nodeIelst = ''
      let dateInFile = null;
      if (arrayOfCsv.length) {
        const line1 = arrayOfCsv[0];
        //const ielstNames = ['tj', 'tgi_code', 'id_jur']
        const datesNames = ["cod_moi", "annee", "mois"];

        /*for (let ielst of ielstNames) {
                    if (ielst in line1) {
                      nodeIelst = ielst
                      break
                    }
                  }*/
        for (let date of datesNames) {
          if (date in line1) {
            if (date === datesNames[0]) {
              dateInFile = date;
              break;
            } else if (date === datesNames[1] || date === datesNames[2]) {
              if (date === datesNames[2] && !(datesNames[1] in line1)) {
                dateInFile = date;
              } else {
                dateInFile = [datesNames[1], datesNames[2]];
              }
              break;
            }
          }
        }
      }

      //for (let i = 0; i < Object.keys(juridictionsGrouped).length; i++) {}
      // Object.keys(juridictionsGrouped).map((tj) => {
      //let ielst = tj
      //if (ielst.length === 6) ielst = `00${ielst}` // format tj to ielst
      //if (I_ELST_LIST[ielst]) {

      // group by month
      let groupByMonthObject = null;
      if (!Array.isArray(dateInFile)) {
        groupByMonthObject = groupBy(arrayOfCsv, dateInFile);
      } else {
        const tmp = arrayOfCsv.map((tj) => {
          const mois =
            tj.mois.length < 2 ? tj.annee + `0${tj.mois}` : tj.annee + tj.mois;
          delete tj.annee;
          return { ...tj, mois: mois };
        });
        groupByMonthObject = groupBy(tmp, dateInFile[1]);
      }

      let list = [];
      const entreeNames = ["nb_aff_nouv", "instr_nb_aff_nouv"];
      const sortieNames = ["nb_aff_end", "instr_nb_aff_cloturee", "nb_aff"];
      const stockNames = ["nb_aff_old", "instr_nb_aff_stock"];
      Object.values(groupByMonthObject).map((monthValues) => {
        // format string to integer

        monthValues = monthValues.map((m) => {
          for (let entree of entreeNames) {
            if (entree in m) {
              m[entree] = m[entree] ? parseInt(m[entree]) : null;
              break;
            }
          }
          for (let sortie of sortieNames) {
            if (sortie in m) {
              m[sortie] = m[sortie] ? parseInt(m[sortie]) : null;
              break;
            }
          }
          for (let stock of stockNames) {
            if (stock in m) {
              m[stock] = m[stock] ? parseInt(m[stock]) : null;
              break;
            }
          }

          return m;
        });

        const actualDate = new Date();
        const year = actualDate.getFullYear().toString();
        let month = (actualDate.getMonth() + 1).toString();
        if (month.length < 2) month = `0${month}`;
        const now = year + month;

        let tmp_date = null;
        if (!Array.isArray(dateInFile)) {
          tmp_date = monthValues[0][dateInFile];
        } else {
          tmp_date = monthValues[0][dateInFile[1]];
        }

        if (tmp_date < now) {
          let formatMonthDataFromRules = null;
          formatMonthDataFromRules = this.formatMonthFromRules(
            monthValues,
            tmpCategoriesOfRules
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

    //writeFileSync(`${outputAllFolder}/AllJuridictions.csv`, 'juridiction,code_import,periode,entrees,sorties,stock,\n')

    for (const [key, value] of Object.entries(JURIDICTIONS_EXPORTS)) {
      appendFileSync(
        `${outputAllFolder}/AllJuridictionsPenal.csv`,
        value
          .map(
            (l) =>
              `${key.replace(/[-_]/g, " ")},${l.code_import},${l.periode},${
                l.entrees
              },${l.sorties},${l.stock},\n`
          )
          .join("")
      );
    }
  }
}
