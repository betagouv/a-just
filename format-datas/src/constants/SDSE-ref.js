export const HEADER_COLUMN_NAMES = [
  "I_ELST",
  "C_TUS",
  "COPRO",
  "NATAFF",
  "MODSAI",
  "MODFIN",
  "AUTSAI",
  "AUTDJU",
  "NBAFFDUR",
  "PERIODE",
  "NBAFF",
];

export const TAG_JURIDICTION_ID_COLUMN_NAME = "I_ELST";
export const TAG_JURIDICTION_VALUE_COLUMN_NAME = "NOM_COMPTEUR";

export const I_ELST_LIST = {
  "00100167": "TJ_LYON", // Lyon
  "00963077": "TJ_LYON", // Villeurbanne
  "00100209": "TJ_NANTERRE", // Nanterre
  "00962960": "TJ_NANTERRE", // Antony
  "00962962": "TJ_NANTERRE", // Asnières-sur-seine
  "00962973": "TJ_NANTERRE", // Boulogne-Billancourt
  "00962986": "TJ_NANTERRE", // Colombes
  "00962988": "TJ_NANTERRE", // Courbevoie
  "00963050": "TJ_NANTERRE", // Puteaux
  "00963073": "TJ_NANTERRE", // Vanves
  "00100086": "TJ_BREST", // Brest
  "00963036": "TJ_BREST", //  Morlaix
  "00100064": "TJ_ANGOULEME", // Angoulême
  "00962985": "TJ_ANGOULEME", // Cognac
  "00100203": "TJ_EPINAL", // Epinal
  "00962991": "TJ_EPINAL", // Saint-Dié des Vosges
  "00100132": "TJ_NANCY", // Nancy
  "00963018": "TJ_NANCY", // Lunéville
  "00100150": "TJ_SENLIS", // Senlis
  "00100112": "TJ_SAINT-ETIENNE", // Saint-Etienne
  "00963031": "TJ_SAINT-ETIENNE", // Montbrison
  "00100039": "TJ_BOURG-EN-BRESSE", // Bourg-en-Bresse
  "00963071": "TJ_BOURG-EN-BRESSE", // Trevoux
  "00962970": "TJ_BOURG-EN-BRESSE", // Belley
  "00963038": "TJ_BOURG-EN-BRESSE", // Nantua
  "00100168": "TJ_VILLEFRANCHE-SUR-SAONE", // Villefranche-sur-Saone
  "00100111": "TJ_ROANNE", // Roanne
  "00100082": "TJ_VALENCE", // Valence
  "00963032": "TJ_VALENCE", // Montélimar
  "00963056": "TJ_VALENCE", // Romans-sur-Isère
  "00100144": "TJ_DUNKERQUE", // Dunkerque
  "00963010": "TJ_DUNKERQUE", // Hazebrouck
  "00100147": "TJ_VALENCIENNES", // Valenciennes
  "00100153": "TJ_ARRAS", // Arras
  "00100141": "TJ_AVESNES_SUR_HELPE", // Avesnes sur helpe
  "00963025": "TJ_AVESNES_SUR_HELPE", // Avesnes sur helpe
  "00100154": "TJ_BETHUNE", // Bethune
  "00963016": "TJ_BETHUNE", // Lens
  "00100155": "TJ_BOULOGNE_SUR_MER", // Boulogne Sur Mer
  "00962977": "TJ_BOULOGNE_SUR_MER", // Calais
  "00963034": "TJ_BOULOGNE_SUR_MER", // Mintreuil
  "00100142": "TJ_CAMBRAI", // Cambrai
  "00100143": "TJ_DOUAI", // Douai
  "00100146": "TJ_LILLE", // Lille
  "00963057": "TJ_LILLE", // Roubaix
  "00963070": "TJ_LILLE", // Tourcoing
  "00100156": "TJ_SAINT_OMER", // St Omer

  // CA RENNES
  "00100135": "TJ_LORIENT", // Lorient
  "00100114": "TJ_NANTES", // Nantes
  "00100088": "TJ_QUIMPER", // Quimper
  "00100098": "TJ_RENNES", // Rennes
  "00963002": "TJ_RENNES", // Fougeres
  "00963053": "TJ_RENNES", // Redon
  "00100076": "TJ_SAINT_BRIEUC", // Saint Brieuc
  "00963008": "TJ_SAINT_BRIEUC", // Guingamp
  "00100099": "TJ_SAINT_MALO", // St Malo
  "00962992": "TJ_SAINT_MALO", // Dinan
  "00100115": "TJ_SAINT_NAZAIRE", // St Nazaire
  "00100136": "TJ_VANNES", // Vannes

  // CA BORDEAUX
  "00100078": "TJ_BERGERAC", // Bergerac
  "00963060": "TJ_BERGERAC", // Sarlat la caneda
  "00100094": "TJ_BORDEAUX", // Bordeaux
  "00962961": "TJ_BORDEAUX", // Arcachon
  "00100095": "TJ_LIBOURNE", // Libourne
  "00100079": "TJ_PERIGUEUX", // Perigueux

  // CA PARIS
  "00100208": "TJ_EVRY", // Evry
  "00962996": "TJ_EVRY", // Etampes
  "00963014": "TJ_EVRY", // Juvisy sur orge
  "00963017": "TJ_EVRY", // Longjumeau
  "00963043": "TJ_EVRY", // Palaiseau

  // CA Versailles
  "00100186": "TJ_VERSAILLES", // Versailles
  "00963004": "TJ_VERSAILLES", // Sain-Germain-En-Laye
  "00963021": "TJ_VERSAILLES", // Mantes La Jolie
  "00963048": "TJ_VERSAILLES", // Poissy
  "00963052": "TJ_VERSAILLES", // Rambouillet

  // CA Pointoise
  "00100212": "TJ_PONTOISE", // Pontoise
  "00963006": "TJ_PONTOISE", // Gonesse
  "00963033": "TJ_PONTOISE", // Montmorency
  "00963059": "TJ_PONTOISE", // Sannois

  // CA Chartres
  "00100085": "TJ_CHARTRES", // Chartres
  "00962995": "TJ_CHARTRES", // Dreux

  // CA EVRY
  "00100208": "TJ_EVRY", // Evry
  "00962996": "TJ_EVRY", // Etampes
  "00963014": "TJ_EVRY", // Juvisy sur orge
  "00963017": "TJ_EVRY", // Longjumeau
  "00963043": "TJ_EVRY", // Palaiseau

  // CA Versailles
  "00100186": "TJ_VERSAILLES", // Versailles
  "00963004": "TJ_VERSAILLES", // St_Germain_en_laye
  "00963021": "TJ_VERSAILLES", // Mantes La Jolie
  "00963048": "TJ_VERSAILLES", // Poissy
  "00963052": "TJ_VERSAILLES", // Rambouillet

  // CA Chartres
  "00100085": "TJ_CHARTRES", // Chartres
  "00962995": "TJ_CHARTRES", // Dreux

  "00100131": "TJ_VAL_DE_BRIEY", // Val-De-Briey
  "00100133": "TJ_BAR_LE_DUC", //  Bar-Le-Duc
  "00100134": "TJ_VERDUN", // Verdun

  "00100096": "TJ_BEZIERS", // Beziers
};
