import { Op, fn, col } from 'sequelize'

const T_PROX = `[
  {
    "Type de juridiction": "CA",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100119,
    "TJ": "TJ AGEN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100119,
    "TJ": "TJ AGEN",
    "Code TPRX/CPH": 101061,
    "TPRX / CPH": "CPH AGEN"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100119,
    "TJ": "TJ AGEN",
    "Code TPRX/CPH": 101062,
    "TPRX / CPH": "CPH MARMANDE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100119,
    "TJ": "TJ AGEN",
    "Code TPRX/CPH": 963022,
    "TPRX / CPH": "TPRX MARMANDE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100119,
    "TJ": "TJ AGEN",
    "Code TPRX/CPH": 963076,
    "TPRX / CPH": "TPRX VILLENEUVE SUR LOT"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100093,
    "TJ": "TJ AUCH",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100093,
    "TJ": "TJ AUCH",
    "Code TPRX/CPH": 101020,
    "TPRX / CPH": "CPH AUCH"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100093,
    "TJ": "TJ AUCH",
    "Code TPRX/CPH": 962987,
    "TPRX / CPH": "TPRX CONDOM"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100118,
    "TJ": "TJ CAHORS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100118,
    "TJ": "TJ CAHORS",
    "Code TPRX/CPH": 101059,
    "TPRX / CPH": "CPH CAHORS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100014,
    "CA": "CA AGEN",
    "Code TJ": 100118,
    "TJ": "TJ CAHORS",
    "Code TPRX/CPH": 962997,
    "TPRX / CPH": "TPRX FIGEAC"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100058,
    "TJ": "TJ AIX EN PROVENCE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100058,
    "TJ": "TJ AIX EN PROVENCE",
    "Code TPRX/CPH": 100970,
    "TPRX / CPH": "CPH AIX EN PROVENCE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100058,
    "TJ": "TJ AIX EN PROVENCE",
    "Code TPRX/CPH": 100973,
    "TPRX / CPH": "CPH MARTIGUES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100058,
    "TJ": "TJ AIX EN PROVENCE",
    "Code TPRX/CPH": 963023,
    "TPRX / CPH": "TPRX MARTIGUES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100058,
    "TJ": "TJ AIX EN PROVENCE",
    "Code TPRX/CPH": 963058,
    "TPRX / CPH": "TPRX SALON DE PROVENCE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100046,
    "TJ": "TJ DIGNE LES BAINS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100046,
    "TJ": "TJ DIGNE LES BAINS",
    "Code TPRX/CPH": 100948,
    "TPRX / CPH": "CPH DIGNE LES BAINS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100046,
    "TJ": "TJ DIGNE LES BAINS",
    "Code TPRX/CPH": 963020,
    "TPRX / CPH": "TPRX MANOSQUE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100195,
    "TJ": "TJ DRAGUIGNAN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100195,
    "TJ": "TJ DRAGUIGNAN",
    "Code TPRX/CPH": 101181,
    "TPRX / CPH": "CPH DRAGUIGNAN"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100195,
    "TJ": "TJ DRAGUIGNAN",
    "Code TPRX/CPH": 101182,
    "TPRX / CPH": "CPH FREJUS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100195,
    "TJ": "TJ DRAGUIGNAN",
    "Code TPRX/CPH": 962975,
    "TPRX / CPH": "TPRX BRIGNOLES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100195,
    "TJ": "TJ DRAGUIGNAN",
    "Code TPRX/CPH": 963003,
    "TPRX / CPH": "TPRX FREJUS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100048,
    "TJ": "TJ GRASSE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100048,
    "TJ": "TJ GRASSE",
    "Code TPRX/CPH": 100952,
    "TPRX / CPH": "CPH CANNES"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100048,
    "TJ": "TJ GRASSE",
    "Code TPRX/CPH": 100953,
    "TPRX / CPH": "CPH GRASSE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100048,
    "TJ": "TJ GRASSE",
    "Code TPRX/CPH": 962959,
    "TPRX / CPH": "TPRX ANTIBES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100048,
    "TJ": "TJ GRASSE",
    "Code TPRX/CPH": 962976,
    "TPRX / CPH": "TPRX CAGNES SUR MER"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100048,
    "TJ": "TJ GRASSE",
    "Code TPRX/CPH": 962978,
    "TPRX / CPH": "TPRX CANNES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100059,
    "TJ": "TJ MARSEILLE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100059,
    "TJ": "TJ MARSEILLE",
    "Code TPRX/CPH": 100972,
    "TPRX / CPH": "CPH MARSEILLE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100059,
    "TJ": "TJ MARSEILLE",
    "Code TPRX/CPH": 962963,
    "TPRX / CPH": "TPRX AUBAGNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100049,
    "TJ": "TJ NICE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100049,
    "TJ": "TJ NICE",
    "Code TPRX/CPH": 100955,
    "TPRX / CPH": "CPH NICE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100049,
    "TJ": "TJ NICE",
    "Code TPRX/CPH": 963027,
    "TPRX / CPH": "TPRX MENTON"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100060,
    "TJ": "TJ TARASCON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100060,
    "TJ": "TJ TARASCON",
    "Code TPRX/CPH": 100971,
    "TPRX / CPH": "CPH ARLES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100196,
    "TJ": "TJ TOULON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100001,
    "CA": "CA AIX EN PROVENCE",
    "Code TJ": 100196,
    "TJ": "TJ TOULON",
    "Code TPRX/CPH": 101183,
    "TPRX / CPH": "CPH TOULON"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100190,
    "TJ": "TJ AMIENS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100190,
    "TJ": "TJ AMIENS",
    "Code TPRX/CPH": 101172,
    "TPRX / CPH": "CPH ABBEVILLE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100190,
    "TJ": "TJ AMIENS",
    "Code TPRX/CPH": 101173,
    "TPRX / CPH": "CPH AMIENS"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100190,
    "TJ": "TJ AMIENS",
    "Code TPRX/CPH": 101175,
    "TPRX / CPH": "CPH PERONNE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100190,
    "TJ": "TJ AMIENS",
    "Code TPRX/CPH": 962954,
    "TPRX / CPH": "TPRX ABBEVILLE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100190,
    "TJ": "TJ AMIENS",
    "Code TPRX/CPH": 963046,
    "TPRX / CPH": "TPRX PERONNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100148,
    "TJ": "TJ BEAUVAIS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100148,
    "TJ": "TJ BEAUVAIS",
    "Code TPRX/CPH": 101106,
    "TPRX / CPH": "CPH BEAUVAIS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100149,
    "TJ": "TJ COMPIEGNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100149,
    "TJ": "TJ COMPIEGNE",
    "Code TPRX/CPH": 101107,
    "TPRX / CPH": "CPH COMPIEGNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100040,
    "TJ": "TJ LAON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100040,
    "TJ": "TJ LAON",
    "Code TPRX/CPH": 100942,
    "TPRX / CPH": "CPH LAON"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100150,
    "TJ": "TJ SENLIS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100150,
    "TJ": "TJ SENLIS",
    "Code TPRX/CPH": 101108,
    "TPRX / CPH": "CPH CREIL"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100042,
    "TJ": "TJ SOISSONS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100042,
    "TJ": "TJ SOISSONS",
    "Code TPRX/CPH": 100944,
    "TPRX / CPH": "CPH SOISSONS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100041,
    "TJ": "TJ ST QUENTIN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100028,
    "CA": "CA AMIENS",
    "Code TJ": 100041,
    "TJ": "TJ ST QUENTIN",
    "Code TPRX/CPH": 100943,
    "TPRX / CPH": "CPH ST QUENTIN"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 100122,
    "TJ": "TJ ANGERS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 100122,
    "TJ": "TJ ANGERS",
    "Code TPRX/CPH": 101064,
    "TPRX / CPH": "CPH ANGERS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 100122,
    "TJ": "TJ ANGERS",
    "Code TPRX/CPH": 962982,
    "TPRX / CPH": "TPRX CHOLET"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 100130,
    "TJ": "TJ LAVAL",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 100130,
    "TJ": "TJ LAVAL",
    "Code TPRX/CPH": 101075,
    "TPRX / CPH": "CPH LAVAL"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 100173,
    "TJ": "TJ LE MANS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 100173,
    "TJ": "TJ LE MANS",
    "Code TPRX/CPH": 101147,
    "TPRX / CPH": "CPH LE MANS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 100173,
    "TJ": "TJ LE MANS",
    "Code TPRX/CPH": 962998,
    "TPRX / CPH": "TPRX LA FLECHE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 948312,
    "TJ": "TJ SAUMUR",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100015,
    "CA": "CA ANGERS",
    "Code TJ": 948312,
    "TJ": "TJ SAUMUR",
    "Code TPRX/CPH": 101066,
    "TPRX / CPH": "CPH SAUMUR"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100031,
    "CA": "CA BASSE TERRE",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100031,
    "CA": "CA BASSE TERRE",
    "Code TJ": 100213,
    "TJ": "TJ BASSE TERRE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100031,
    "CA": "CA BASSE TERRE",
    "Code TJ": 100213,
    "TJ": "TJ BASSE TERRE",
    "Code TPRX/CPH": 101211,
    "TPRX / CPH": "CPH BASSE TERRE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100031,
    "CA": "CA BASSE TERRE",
    "Code TJ": 100213,
    "TJ": "TJ BASSE TERRE",
    "Code TPRX/CPH": 963024,
    "TPRX / CPH": "TPRX ST MARTIN"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100031,
    "CA": "CA BASSE TERRE",
    "Code TJ": 100214,
    "TJ": "TJ POINTE A PITRE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100031,
    "CA": "CA BASSE TERRE",
    "Code TJ": 100214,
    "TJ": "TJ POINTE A PITRE",
    "Code TPRX/CPH": 101212,
    "TPRX / CPH": "CPH POINTE A PITRE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100004,
    "CA": "CA BASTIA",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100004,
    "CA": "CA BASTIA",
    "Code TJ": 100071,
    "TJ": "TJ AJACCIO",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100004,
    "CA": "CA BASTIA",
    "Code TJ": 100071,
    "TJ": "TJ AJACCIO",
    "Code TPRX/CPH": 100990,
    "TPRX / CPH": "CPH AJACCIO"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100004,
    "CA": "CA BASTIA",
    "Code TJ": 100072,
    "TJ": "TJ BASTIA",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100004,
    "CA": "CA BASTIA",
    "Code TJ": 100072,
    "TJ": "TJ BASTIA",
    "Code TPRX/CPH": 100991,
    "TPRX / CPH": "CPH BASTIA"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100207,
    "TJ": "TJ BELFORT",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100207,
    "TJ": "TJ BELFORT",
    "Code TPRX/CPH": 101199,
    "TPRX / CPH": "CPH BELFORT"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100080,
    "TJ": "TJ BESANCON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100080,
    "TJ": "TJ BESANCON",
    "Code TPRX/CPH": 101000,
    "TPRX / CPH": "CPH BESANCON"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100080,
    "TJ": "TJ BESANCON",
    "Code TPRX/CPH": 963049,
    "TPRX / CPH": "TPRX PONTARLIER"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100106,
    "TJ": "TJ LONS LE SAUNIER",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100106,
    "TJ": "TJ LONS LE SAUNIER",
    "Code TPRX/CPH": 101041,
    "TPRX / CPH": "CPH DOLE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100106,
    "TJ": "TJ LONS LE SAUNIER",
    "Code TPRX/CPH": 101042,
    "TPRX / CPH": "CPH LONS LE SAUNIER"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100106,
    "TJ": "TJ LONS LE SAUNIER",
    "Code TPRX/CPH": 962984,
    "TPRX / CPH": "TPRX ST CLAUDE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100106,
    "TJ": "TJ LONS LE SAUNIER",
    "Code TPRX/CPH": 962994,
    "TPRX / CPH": "TPRX DOLE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100081,
    "TJ": "TJ MONTBELIARD",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100081,
    "TJ": "TJ MONTBELIARD",
    "Code TPRX/CPH": 101001,
    "TPRX / CPH": "CPH MONTBELIARD"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100170,
    "TJ": "TJ VESOUL",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100170,
    "TJ": "TJ VESOUL",
    "Code TPRX/CPH": 101140,
    "TPRX / CPH": "CPH LURE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100170,
    "TJ": "TJ VESOUL",
    "Code TPRX/CPH": 101141,
    "TPRX / CPH": "CPH VESOUL"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100006,
    "CA": "CA BESANCON",
    "Code TJ": 100170,
    "TJ": "TJ VESOUL",
    "Code TPRX/CPH": 963019,
    "TPRX / CPH": "TPRX LURE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100064,
    "TJ": "TJ ANGOULEME",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100064,
    "TJ": "TJ ANGOULEME",
    "Code TPRX/CPH": 100981,
    "TPRX / CPH": "CPH ANGOULEME"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100064,
    "TJ": "TJ ANGOULEME",
    "Code TPRX/CPH": 962985,
    "TPRX / CPH": "TPRX COGNAC"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100078,
    "TJ": "TJ BERGERAC",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100078,
    "TJ": "TJ BERGERAC",
    "Code TPRX/CPH": 100998,
    "TPRX / CPH": "CPH BERGERAC"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100078,
    "TJ": "TJ BERGERAC",
    "Code TPRX/CPH": 963060,
    "TPRX / CPH": "TPRX SARLAT LA CANEDA"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100094,
    "TJ": "TJ BORDEAUX",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100094,
    "TJ": "TJ BORDEAUX",
    "Code TPRX/CPH": 101021,
    "TPRX / CPH": "CPH BORDEAUX"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100094,
    "TJ": "TJ BORDEAUX",
    "Code TPRX/CPH": 962961,
    "TPRX / CPH": "TPRX ARCACHON"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100095,
    "TJ": "TJ LIBOURNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100095,
    "TJ": "TJ LIBOURNE",
    "Code TPRX/CPH": 101022,
    "TPRX / CPH": "CPH LIBOURNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100079,
    "TJ": "TJ PERIGUEUX",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100009,
    "CA": "CA BORDEAUX",
    "Code TJ": 100079,
    "TJ": "TJ PERIGUEUX",
    "Code TPRX/CPH": 100999,
    "TPRX / CPH": "CPH PERIGUEUX"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100003,
    "CA": "CA BOURGES",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100003,
    "CA": "CA BOURGES",
    "Code TJ": 100068,
    "TJ": "TJ BOURGES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100003,
    "CA": "CA BOURGES",
    "Code TJ": 100068,
    "TJ": "TJ BOURGES",
    "Code TPRX/CPH": 100986,
    "TPRX / CPH": "CPH BOURGES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100003,
    "CA": "CA BOURGES",
    "Code TJ": 100068,
    "TJ": "TJ BOURGES",
    "Code TPRX/CPH": 962955,
    "TPRX / CPH": "TPRX ST AMAND MONTROND"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100003,
    "CA": "CA BOURGES",
    "Code TJ": 100100,
    "TJ": "TJ CHATEAUROUX",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100003,
    "CA": "CA BOURGES",
    "Code TJ": 100100,
    "TJ": "TJ CHATEAUROUX",
    "Code TPRX/CPH": 101033,
    "TPRX / CPH": "CPH CHATEAUROUX"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100003,
    "CA": "CA BOURGES",
    "Code TJ": 100140,
    "TJ": "TJ NEVERS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100003,
    "CA": "CA BOURGES",
    "Code TJ": 100140,
    "TJ": "TJ NEVERS",
    "Code TPRX/CPH": 101089,
    "TPRX / CPH": "CPH NEVERS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100003,
    "CA": "CA BOURGES",
    "Code TJ": 100140,
    "TJ": "TJ NEVERS",
    "Code TPRX/CPH": 962983,
    "TPRX / CPH": "TPRX CLAMECY"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100151,
    "TJ": "TJ ALENCON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100151,
    "TJ": "TJ ALENCON",
    "Code TPRX/CPH": 101109,
    "TPRX / CPH": "CPH ALENCON"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100152,
    "TJ": "TJ ARGENTAN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100152,
    "TJ": "TJ ARGENTAN",
    "Code TPRX/CPH": 101110,
    "TPRX / CPH": "CPH ARGENTAN"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100152,
    "TJ": "TJ ARGENTAN",
    "Code TPRX/CPH": 962999,
    "TPRX / CPH": "TPRX FLERS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100061,
    "TJ": "TJ CAEN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100061,
    "TJ": "TJ CAEN",
    "Code TPRX/CPH": 100975,
    "TPRX / CPH": "CPH CAEN"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100061,
    "TJ": "TJ CAEN",
    "Code TPRX/CPH": 963078,
    "TPRX / CPH": "TPRX VIRE NORMANDIE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100125,
    "TJ": "TJ CHERBOURG-EN-COTENTIN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100125,
    "TJ": "TJ CHERBOURG-EN-COTENTIN",
    "Code TPRX/CPH": 101068,
    "TPRX / CPH": "CPH CHERBOURG-EN-COTENTIN"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100126,
    "TJ": "TJ COUTANCES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100126,
    "TJ": "TJ COUTANCES",
    "Code TPRX/CPH": 101067,
    "TPRX / CPH": "CPH AVRANCHES"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100126,
    "TJ": "TJ COUTANCES",
    "Code TPRX/CPH": 101069,
    "TPRX / CPH": "CPH COUTANCES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100126,
    "TJ": "TJ COUTANCES",
    "Code TPRX/CPH": 962968,
    "TPRX / CPH": "TPRX AVRANCHES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100062,
    "TJ": "TJ LISIEUX",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100002,
    "CA": "CA CAEN",
    "Code TJ": 100062,
    "TJ": "TJ LISIEUX",
    "Code TPRX/CPH": 100977,
    "TPRX / CPH": "CPH LISIEUX"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 943116,
    "CA": "CA CAYENNE",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 943116,
    "CA": "CA CAYENNE",
    "Code TJ": 100216,
    "TJ": "TJ CAYENNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 943116,
    "CA": "CA CAYENNE",
    "Code TJ": 100216,
    "TJ": "TJ CAYENNE",
    "Code TPRX/CPH": 101214,
    "TPRX / CPH": "CPH CAYENNE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 943116,
    "CA": "CA CAYENNE",
    "Code TJ": 100216,
    "TJ": "TJ CAYENNE",
    "Code TPRX/CPH": 963066,
    "TPRX / CPH": "TPRX ST LAURENT DU MARONI"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100174,
    "TJ": "TJ ALBERTVILLE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100174,
    "TJ": "TJ ALBERTVILLE",
    "Code TPRX/CPH": 101149,
    "TPRX / CPH": "CPH ALBERTVILLE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100176,
    "TJ": "TJ ANNECY",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100176,
    "TJ": "TJ ANNECY",
    "Code TPRX/CPH": 101151,
    "TPRX / CPH": "CPH ANNECY"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100177,
    "TJ": "TJ BONNEVILLE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100177,
    "TJ": "TJ BONNEVILLE",
    "Code TPRX/CPH": 101153,
    "TPRX / CPH": "CPH BONNEVILLE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100175,
    "TJ": "TJ CHAMBERY",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100175,
    "TJ": "TJ CHAMBERY",
    "Code TPRX/CPH": 101148,
    "TPRX / CPH": "CPH AIX LES BAINS"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100175,
    "TJ": "TJ CHAMBERY",
    "Code TPRX/CPH": 101150,
    "TPRX / CPH": "CPH CHAMBERY"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100178,
    "TJ": "TJ THONON LES BAINS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100178,
    "TJ": "TJ THONON LES BAINS",
    "Code TPRX/CPH": 101152,
    "TPRX / CPH": "CPH ANNEMASSE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100024,
    "CA": "CA CHAMBERY",
    "Code TJ": 100178,
    "TJ": "TJ THONON LES BAINS",
    "Code TPRX/CPH": 962957,
    "TPRX / CPH": "TPRX ANNEMASSE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100165,
    "TJ": "TJ COLMAR",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100165,
    "TJ": "TJ COLMAR",
    "Code TPRX/CPH": 101134,
    "TPRX / CPH": "CPH COLMAR"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100165,
    "TJ": "TJ COLMAR",
    "Code TPRX/CPH": 963007,
    "TPRX / CPH": "TPRX GUEBWILLER"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100165,
    "TJ": "TJ COLMAR",
    "Code TPRX/CPH": 963064,
    "TPRX / CPH": "TPRX SELESTAT"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100166,
    "TJ": "TJ MULHOUSE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100166,
    "TJ": "TJ MULHOUSE",
    "Code TPRX/CPH": 101136,
    "TPRX / CPH": "CPH MULHOUSE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100166,
    "TJ": "TJ MULHOUSE",
    "Code TPRX/CPH": 963068,
    "TPRX / CPH": "TPRX THANN"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100163,
    "TJ": "TJ SAVERNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100163,
    "TJ": "TJ SAVERNE",
    "Code TPRX/CPH": 101129,
    "TPRX / CPH": "CPH SAVERNE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100163,
    "TJ": "TJ SAVERNE",
    "Code TPRX/CPH": 963029,
    "TPRX / CPH": "TPRX MOLSHEIM"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100164,
    "TJ": "TJ STRASBOURG",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100164,
    "TJ": "TJ STRASBOURG",
    "Code TPRX/CPH": 101127,
    "TPRX / CPH": "CPH HAGUENAU"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100164,
    "TJ": "TJ STRASBOURG",
    "Code TPRX/CPH": 101130,
    "TPRX / CPH": "CPH SCHILTIGHEIM"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100164,
    "TJ": "TJ STRASBOURG",
    "Code TPRX/CPH": 101132,
    "TPRX / CPH": "CPH STRASBOURG"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100164,
    "TJ": "TJ STRASBOURG",
    "Code TPRX/CPH": 963009,
    "TPRX / CPH": "TPRX HAGUENAU"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100164,
    "TJ": "TJ STRASBOURG",
    "Code TPRX/CPH": 963011,
    "TPRX / CPH": "TPRX ILLKIRCH GRAFFENSTADEN"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100022,
    "CA": "CA COLMAR",
    "Code TJ": 100164,
    "TJ": "TJ STRASBOURG",
    "Code TPRX/CPH": 963062,
    "TPRX / CPH": "TPRX SCHILTIGHEIM"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100171,
    "TJ": "TJ CHALON SUR SAONE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100171,
    "TJ": "TJ CHALON SUR SAONE",
    "Code TPRX/CPH": 101143,
    "TPRX / CPH": "CPH CHALON SUR SAONE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100171,
    "TJ": "TJ CHALON SUR SAONE",
    "Code TPRX/CPH": 962989,
    "TPRX / CPH": "TPRX LE CREUSOT"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100129,
    "TJ": "TJ CHAUMONT",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100129,
    "TJ": "TJ CHAUMONT",
    "Code TPRX/CPH": 101073,
    "TPRX / CPH": "CPH CHAUMONT"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100129,
    "TJ": "TJ CHAUMONT",
    "Code TPRX/CPH": 962993,
    "TPRX / CPH": "TPRX ST DIZIER"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100073,
    "TJ": "TJ DIJON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100073,
    "TJ": "TJ DIJON",
    "Code TPRX/CPH": 100993,
    "TPRX / CPH": "CPH DIJON"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100073,
    "TJ": "TJ DIJON",
    "Code TPRX/CPH": 962969,
    "TPRX / CPH": "TPRX BEAUNE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100073,
    "TJ": "TJ DIJON",
    "Code TPRX/CPH": 963030,
    "TPRX / CPH": "TPRX MONTBARD"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100172,
    "TJ": "TJ MACON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100005,
    "CA": "CA DIJON",
    "Code TJ": 100172,
    "TJ": "TJ MACON",
    "Code TPRX/CPH": 101145,
    "TPRX / CPH": "CPH MACON"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100153,
    "TJ": "TJ ARRAS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100153,
    "TJ": "TJ ARRAS",
    "Code TPRX/CPH": 101112,
    "TPRX / CPH": "CPH ARRAS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100141,
    "TJ": "TJ AVESNES SUR HELPE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100141,
    "TJ": "TJ AVESNES SUR HELPE",
    "Code TPRX/CPH": 937373,
    "TPRX / CPH": "CPH AVESNES SUR HELPE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100141,
    "TJ": "TJ AVESNES SUR HELPE",
    "Code TPRX/CPH": 963025,
    "TPRX / CPH": "TPRX MAUBEUGE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100154,
    "TJ": "TJ BETHUNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100154,
    "TJ": "TJ BETHUNE",
    "Code TPRX/CPH": 101113,
    "TPRX / CPH": "CPH BETHUNE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100154,
    "TJ": "TJ BETHUNE",
    "Code TPRX/CPH": 101116,
    "TPRX / CPH": "CPH LENS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100154,
    "TJ": "TJ BETHUNE",
    "Code TPRX/CPH": 963016,
    "TPRX / CPH": "TPRX LENS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100155,
    "TJ": "TJ BOULOGNE SUR MER",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100155,
    "TJ": "TJ BOULOGNE SUR MER",
    "Code TPRX/CPH": 101114,
    "TPRX / CPH": "CPH BOULOGNE SUR MER"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100155,
    "TJ": "TJ BOULOGNE SUR MER",
    "Code TPRX/CPH": 101115,
    "TPRX / CPH": "CPH CALAIS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100155,
    "TJ": "TJ BOULOGNE SUR MER",
    "Code TPRX/CPH": 962977,
    "TPRX / CPH": "TPRX CALAIS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100155,
    "TJ": "TJ BOULOGNE SUR MER",
    "Code TPRX/CPH": 963034,
    "TPRX / CPH": "TPRX MONTREUIL (62)"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100142,
    "TJ": "TJ CAMBRAI",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100142,
    "TJ": "TJ CAMBRAI",
    "Code TPRX/CPH": 101091,
    "TPRX / CPH": "CPH CAMBRAI"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100143,
    "TJ": "TJ DOUAI",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100143,
    "TJ": "TJ DOUAI",
    "Code TPRX/CPH": 101094,
    "TPRX / CPH": "CPH DOUAI"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100144,
    "TJ": "TJ DUNKERQUE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100144,
    "TJ": "TJ DUNKERQUE",
    "Code TPRX/CPH": 101095,
    "TPRX / CPH": "CPH DUNKERQUE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100144,
    "TJ": "TJ DUNKERQUE",
    "Code TPRX/CPH": 101099,
    "TPRX / CPH": "CPH HAZEBROUCK"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100144,
    "TJ": "TJ DUNKERQUE",
    "Code TPRX/CPH": 963010,
    "TPRX / CPH": "TPRX HAZEBROUCK"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100146,
    "TJ": "TJ LILLE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100146,
    "TJ": "TJ LILLE",
    "Code TPRX/CPH": 101100,
    "TPRX / CPH": "CPH LANNOY"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100146,
    "TJ": "TJ LILLE",
    "Code TPRX/CPH": 101101,
    "TPRX / CPH": "CPH LILLE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100146,
    "TJ": "TJ LILLE",
    "Code TPRX/CPH": 101103,
    "TPRX / CPH": "CPH ROUBAIX"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100146,
    "TJ": "TJ LILLE",
    "Code TPRX/CPH": 101104,
    "TPRX / CPH": "CPH TOURCOING"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100146,
    "TJ": "TJ LILLE",
    "Code TPRX/CPH": 963057,
    "TPRX / CPH": "TPRX ROUBAIX"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100146,
    "TJ": "TJ LILLE",
    "Code TPRX/CPH": 963070,
    "TPRX / CPH": "TPRX TOURCOING"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100156,
    "TJ": "TJ ST OMER",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100156,
    "TJ": "TJ ST OMER",
    "Code TPRX/CPH": 101118,
    "TPRX / CPH": "CPH ST OMER"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100147,
    "TJ": "TJ VALENCIENNES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100019,
    "CA": "CA DOUAI",
    "Code TJ": 100147,
    "TJ": "TJ VALENCIENNES",
    "Code TPRX/CPH": 101105,
    "TPRX / CPH": "CPH VALENCIENNES"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100032,
    "CA": "CA FORT DE FRANCE",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100032,
    "CA": "CA FORT DE FRANCE",
    "Code TJ": 100215,
    "TJ": "TJ FORT DE FRANCE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100032,
    "CA": "CA FORT DE FRANCE",
    "Code TJ": 100215,
    "TJ": "TJ FORT DE FRANCE",
    "Code TPRX/CPH": 101213,
    "TPRX / CPH": "CPH FORT DE FRANCE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100102,
    "TJ": "TJ BOURGOIN JALLIEU",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100102,
    "TJ": "TJ BOURGOIN JALLIEU",
    "Code TPRX/CPH": 101036,
    "TPRX / CPH": "CPH BOURGOIN JALLIEU"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100047,
    "TJ": "TJ GAP",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100047,
    "TJ": "TJ GAP",
    "Code TPRX/CPH": 100951,
    "TPRX / CPH": "CPH GAP"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100103,
    "TJ": "TJ GRENOBLE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100103,
    "TJ": "TJ GRENOBLE",
    "Code TPRX/CPH": 905647,
    "TPRX / CPH": "CPH GRENOBLE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100082,
    "TJ": "TJ VALENCE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100082,
    "TJ": "TJ VALENCE",
    "Code TPRX/CPH": 101002,
    "TPRX / CPH": "CPH MONTELIMAR"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100082,
    "TJ": "TJ VALENCE",
    "Code TPRX/CPH": 101004,
    "TPRX / CPH": "CPH VALENCE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100082,
    "TJ": "TJ VALENCE",
    "Code TPRX/CPH": 963032,
    "TPRX / CPH": "TPRX MONTELIMAR"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100082,
    "TJ": "TJ VALENCE",
    "Code TPRX/CPH": 963056,
    "TPRX / CPH": "TPRX ROMANS SUR ISERE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100104,
    "TJ": "TJ VIENNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100012,
    "CA": "CA GRENOBLE",
    "Code TJ": 100104,
    "TJ": "TJ VIENNE",
    "Code TPRX/CPH": 101039,
    "TPRX / CPH": "CPH VIENNE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100030,
    "CA": "CA LIMOGES",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100030,
    "CA": "CA LIMOGES",
    "Code TJ": 100069,
    "TJ": "TJ BRIVE LA GAILLARDE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100030,
    "CA": "CA LIMOGES",
    "Code TJ": 100069,
    "TJ": "TJ BRIVE LA GAILLARDE",
    "Code TPRX/CPH": 100988,
    "TPRX / CPH": "CPH BRIVE LA GAILLARDE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100030,
    "CA": "CA LIMOGES",
    "Code TJ": 100077,
    "TJ": "TJ GUERET",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100030,
    "CA": "CA LIMOGES",
    "Code TJ": 100077,
    "TJ": "TJ GUERET",
    "Code TPRX/CPH": 100997,
    "TPRX / CPH": "CPH GUERET"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100030,
    "CA": "CA LIMOGES",
    "Code TJ": 100202,
    "TJ": "TJ LIMOGES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100030,
    "CA": "CA LIMOGES",
    "Code TJ": 100202,
    "TJ": "TJ LIMOGES",
    "Code TPRX/CPH": 101191,
    "TPRX / CPH": "CPH LIMOGES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100030,
    "CA": "CA LIMOGES",
    "Code TJ": 948314,
    "TJ": "TJ TULLE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100030,
    "CA": "CA LIMOGES",
    "Code TJ": 948314,
    "TJ": "TJ TULLE",
    "Code TPRX/CPH": 100989,
    "TPRX / CPH": "CPH TULLE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100039,
    "TJ": "TJ BOURG EN BRESSE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100039,
    "TJ": "TJ BOURG EN BRESSE",
    "Code TPRX/CPH": 100936,
    "TPRX / CPH": "CPH BELLEY"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100039,
    "TJ": "TJ BOURG EN BRESSE",
    "Code TPRX/CPH": 100937,
    "TPRX / CPH": "CPH BOURG EN BRESSE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100039,
    "TJ": "TJ BOURG EN BRESSE",
    "Code TPRX/CPH": 100938,
    "TPRX / CPH": "CPH OYONNAX"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100039,
    "TJ": "TJ BOURG EN BRESSE",
    "Code TPRX/CPH": 962970,
    "TPRX / CPH": "TPRX BELLEY"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100039,
    "TJ": "TJ BOURG EN BRESSE",
    "Code TPRX/CPH": 963038,
    "TPRX / CPH": "TPRX NANTUA"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100039,
    "TJ": "TJ BOURG EN BRESSE",
    "Code TPRX/CPH": 963071,
    "TPRX / CPH": "TPRX TREVOUX"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100167,
    "TJ": "TJ LYON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100167,
    "TJ": "TJ LYON",
    "Code TPRX/CPH": 101138,
    "TPRX / CPH": "CPH LYON"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100167,
    "TJ": "TJ LYON",
    "Code TPRX/CPH": 963077,
    "TPRX / CPH": "TPRX VILLEURBANNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100111,
    "TJ": "TJ ROANNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100111,
    "TJ": "TJ ROANNE",
    "Code TPRX/CPH": 101051,
    "TPRX / CPH": "CPH ROANNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100112,
    "TJ": "TJ ST ETIENNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100112,
    "TJ": "TJ ST ETIENNE",
    "Code TPRX/CPH": 101049,
    "TPRX / CPH": "CPH MONTBRISON"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100112,
    "TJ": "TJ ST ETIENNE",
    "Code TPRX/CPH": 101053,
    "TPRX / CPH": "CPH ST ETIENNE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100112,
    "TJ": "TJ ST ETIENNE",
    "Code TPRX/CPH": 963031,
    "TPRX / CPH": "TPRX MONTBRISON"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100168,
    "TJ": "TJ VILLEFRANCHE SUR SAONE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100023,
    "CA": "CA LYON",
    "Code TJ": 100168,
    "TJ": "TJ VILLEFRANCHE SUR SAONE",
    "Code TPRX/CPH": 101139,
    "TPRX / CPH": "CPH VILLEFRANCHE SUR SAONE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100018,
    "CA": "CA METZ",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100018,
    "CA": "CA METZ",
    "Code TJ": 100137,
    "TJ": "TJ METZ",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100018,
    "CA": "CA METZ",
    "Code TJ": 100137,
    "TJ": "TJ METZ",
    "Code TPRX/CPH": 101085,
    "TPRX / CPH": "CPH METZ"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100018,
    "CA": "CA METZ",
    "Code TJ": 100137,
    "TJ": "TJ METZ",
    "Code TPRX/CPH": 963061,
    "TPRX / CPH": "TPRX SARREBOURG"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100018,
    "CA": "CA METZ",
    "Code TJ": 100138,
    "TJ": "TJ SARREGUEMINES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100018,
    "CA": "CA METZ",
    "Code TJ": 100138,
    "TJ": "TJ SARREGUEMINES",
    "Code TPRX/CPH": 101084,
    "TPRX / CPH": "CPH FORBACH"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100018,
    "CA": "CA METZ",
    "Code TJ": 100138,
    "TJ": "TJ SARREGUEMINES",
    "Code TPRX/CPH": 962967,
    "TPRX / CPH": "TPRX ST AVOLD"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100018,
    "CA": "CA METZ",
    "Code TJ": 100139,
    "TJ": "TJ THIONVILLE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100018,
    "CA": "CA METZ",
    "Code TJ": 100139,
    "TJ": "TJ THIONVILLE",
    "Code TPRX/CPH": 101088,
    "TPRX / CPH": "CPH THIONVILLE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100096,
    "TJ": "TJ BEZIERS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100096,
    "TJ": "TJ BEZIERS",
    "Code TPRX/CPH": 101024,
    "TPRX / CPH": "CPH BEZIERS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100054,
    "TJ": "TJ CARCASSONNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100054,
    "TJ": "TJ CARCASSONNE",
    "Code TPRX/CPH": 100965,
    "TPRX / CPH": "CPH CARCASSONNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100097,
    "TJ": "TJ MONTPELLIER",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100097,
    "TJ": "TJ MONTPELLIER",
    "Code TPRX/CPH": 101026,
    "TPRX / CPH": "CPH MONTPELLIER"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100097,
    "TJ": "TJ MONTPELLIER",
    "Code TPRX/CPH": 101027,
    "TPRX / CPH": "CPH SETE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100097,
    "TJ": "TJ MONTPELLIER",
    "Code TPRX/CPH": 963065,
    "TPRX / CPH": "TPRX SETE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100055,
    "TJ": "TJ NARBONNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100055,
    "TJ": "TJ NARBONNE",
    "Code TPRX/CPH": 100966,
    "TPRX / CPH": "CPH NARBONNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100162,
    "TJ": "TJ PERPIGNAN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100162,
    "TJ": "TJ PERPIGNAN",
    "Code TPRX/CPH": 101126,
    "TPRX / CPH": "CPH PERPIGNAN"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100057,
    "TJ": "TJ RODEZ",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100057,
    "TJ": "TJ RODEZ",
    "Code TPRX/CPH": 100968,
    "TPRX / CPH": "CPH MILLAU"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100057,
    "TJ": "TJ RODEZ",
    "Code TPRX/CPH": 100969,
    "TPRX / CPH": "CPH RODEZ"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100010,
    "CA": "CA MONTPELLIER",
    "Code TJ": 100057,
    "TJ": "TJ RODEZ",
    "Code TPRX/CPH": 963028,
    "TPRX / CPH": "TPRX MILLAU"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100133,
    "TJ": "TJ BAR LE DUC",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100133,
    "TJ": "TJ BAR LE DUC",
    "Code TPRX/CPH": 101080,
    "TPRX / CPH": "CPH BAR LE DUC"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100203,
    "TJ": "TJ EPINAL",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100203,
    "TJ": "TJ EPINAL",
    "Code TPRX/CPH": 101193,
    "TPRX / CPH": "CPH EPINAL"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100203,
    "TJ": "TJ EPINAL",
    "Code TPRX/CPH": 101196,
    "TPRX / CPH": "CPH ST DIE DES VOSGES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100203,
    "TJ": "TJ EPINAL",
    "Code TPRX/CPH": 962991,
    "TPRX / CPH": "TPRX ST DIE DES VOSGES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100132,
    "TJ": "TJ NANCY",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100132,
    "TJ": "TJ NANCY",
    "Code TPRX/CPH": 101079,
    "TPRX / CPH": "CPH NANCY"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100132,
    "TJ": "TJ NANCY",
    "Code TPRX/CPH": 963018,
    "TPRX / CPH": "TPRX LUNEVILLE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100131,
    "TJ": "TJ VAL DE BRIEY",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100131,
    "TJ": "TJ VAL DE BRIEY",
    "Code TPRX/CPH": 101077,
    "TPRX / CPH": "CPH LONGWY"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100134,
    "TJ": "TJ VERDUN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100017,
    "CA": "CA NANCY",
    "Code TJ": 100134,
    "TJ": "TJ VERDUN",
    "Code TPRX/CPH": 101081,
    "TPRX / CPH": "CPH VERDUN"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100089,
    "TJ": "TJ ALES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100089,
    "TJ": "TJ ALES",
    "Code TPRX/CPH": 101016,
    "TPRX / CPH": "CPH ALES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100197,
    "TJ": "TJ AVIGNON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100197,
    "TJ": "TJ AVIGNON",
    "Code TPRX/CPH": 101184,
    "TPRX / CPH": "CPH AVIGNON"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100197,
    "TJ": "TJ AVIGNON",
    "Code TPRX/CPH": 963047,
    "TPRX / CPH": "TPRX PERTUIS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100198,
    "TJ": "TJ CARPENTRAS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100198,
    "TJ": "TJ CARPENTRAS",
    "Code TPRX/CPH": 101186,
    "TPRX / CPH": "CPH ORANGE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100198,
    "TJ": "TJ CARPENTRAS",
    "Code TPRX/CPH": 963041,
    "TPRX / CPH": "TPRX ORANGE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100121,
    "TJ": "TJ MENDE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100121,
    "TJ": "TJ MENDE",
    "Code TPRX/CPH": 101063,
    "TPRX / CPH": "CPH MENDE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100090,
    "TJ": "TJ NIMES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100090,
    "TJ": "TJ NIMES",
    "Code TPRX/CPH": 101017,
    "TPRX / CPH": "CPH NIMES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100090,
    "TJ": "TJ NIMES",
    "Code TPRX/CPH": 963072,
    "TPRX / CPH": "TPRX UZES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100050,
    "TJ": "TJ PRIVAS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100050,
    "TJ": "TJ PRIVAS",
    "Code TPRX/CPH": 100956,
    "TPRX / CPH": "CPH ANNONAY"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100050,
    "TJ": "TJ PRIVAS",
    "Code TPRX/CPH": 100957,
    "TPRX / CPH": "CPH AUBENAS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100050,
    "TJ": "TJ PRIVAS",
    "Code TPRX/CPH": 962958,
    "TPRX / CPH": "TPRX ANNONAY"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100007,
    "CA": "CA NIMES",
    "Code TJ": 100050,
    "TJ": "TJ PRIVAS",
    "Code TPRX/CPH": 962964,
    "TPRX / CPH": "TPRX AUBENAS"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100037,
    "CA": "CA NOUMEA",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100037,
    "CA": "CA NOUMEA",
    "Code TJ": 100221,
    "TJ": "TPI MATA-UTU",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100037,
    "CA": "CA NOUMEA",
    "Code TJ": 100223,
    "TJ": "TPI NOUMEA",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100037,
    "CA": "CA NOUMEA",
    "Code TJ": 100223,
    "TJ": "TPI NOUMEA",
    "Code TPRX/CPH": 916801,
    "TPRX / CPH": "CPH NOUMEA"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100013,
    "CA": "CA ORLEANS",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100013,
    "CA": "CA ORLEANS",
    "Code TJ": 100109,
    "TJ": "TJ BLOIS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100013,
    "CA": "CA ORLEANS",
    "Code TJ": 100109,
    "TJ": "TJ BLOIS",
    "Code TPRX/CPH": 101046,
    "TPRX / CPH": "CPH BLOIS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100013,
    "CA": "CA ORLEANS",
    "Code TJ": 100116,
    "TJ": "TJ MONTARGIS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100013,
    "CA": "CA ORLEANS",
    "Code TJ": 100116,
    "TJ": "TJ MONTARGIS",
    "Code TPRX/CPH": 101057,
    "TPRX / CPH": "CPH MONTARGIS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100013,
    "CA": "CA ORLEANS",
    "Code TJ": 100117,
    "TJ": "TJ ORLEANS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100013,
    "CA": "CA ORLEANS",
    "Code TJ": 100117,
    "TJ": "TJ ORLEANS",
    "Code TPRX/CPH": 101058,
    "TPRX / CPH": "CPH ORLEANS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100013,
    "CA": "CA ORLEANS",
    "Code TJ": 100101,
    "TJ": "TJ TOURS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100013,
    "CA": "CA ORLEANS",
    "Code TJ": 100101,
    "TJ": "TJ TOURS",
    "Code TPRX/CPH": 101035,
    "TPRX / CPH": "CPH TOURS"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100036,
    "CA": "CA PAPEETE",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100036,
    "CA": "CA PAPEETE",
    "Code TJ": 100222,
    "TJ": "TPI PAPEETE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100036,
    "CA": "CA PAPEETE",
    "Code TJ": 100222,
    "TJ": "TPI PAPEETE",
    "Code TPRX/CPH": 916803,
    "TPRX / CPH": "CPH PAPEETE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100205,
    "TJ": "TJ AUXERRE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100205,
    "TJ": "TJ AUXERRE",
    "Code TPRX/CPH": 101197,
    "TPRX / CPH": "CPH AUXERRE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100210,
    "TJ": "TJ BOBIGNY",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100210,
    "TJ": "TJ BOBIGNY",
    "Code TPRX/CPH": 101205,
    "TPRX / CPH": "CPH BOBIGNY"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100210,
    "TJ": "TJ BOBIGNY",
    "Code TPRX/CPH": 962965,
    "TPRX / CPH": "TPRX AUBERVILLIERS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100210,
    "TJ": "TJ BOBIGNY",
    "Code TPRX/CPH": 962966,
    "TPRX / CPH": "TPRX AULNAY SOUS BOIS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100210,
    "TJ": "TJ BOBIGNY",
    "Code TPRX/CPH": 962990,
    "TPRX / CPH": "TPRX ST DENIS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100210,
    "TJ": "TJ BOBIGNY",
    "Code TPRX/CPH": 963035,
    "TPRX / CPH": "TPRX MONTREUIL (93)"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100210,
    "TJ": "TJ BOBIGNY",
    "Code TPRX/CPH": 963042,
    "TPRX / CPH": "TPRX ST OUEN"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100210,
    "TJ": "TJ BOBIGNY",
    "Code TPRX/CPH": 963044,
    "TPRX / CPH": "TPRX PANTIN"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100210,
    "TJ": "TJ BOBIGNY",
    "Code TPRX/CPH": 963051,
    "TPRX / CPH": "TPRX LE RAINCY"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100211,
    "TJ": "TJ CRETEIL",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100211,
    "TJ": "TJ CRETEIL",
    "Code TPRX/CPH": 101206,
    "TPRX / CPH": "CPH CRETEIL"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100211,
    "TJ": "TJ CRETEIL",
    "Code TPRX/CPH": 101207,
    "TPRX / CPH": "CPH VILLENEUVE ST GEORGES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100211,
    "TJ": "TJ CRETEIL",
    "Code TPRX/CPH": 962980,
    "TPRX / CPH": "TPRX CHARENTON LE PONT"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100211,
    "TJ": "TJ CRETEIL",
    "Code TPRX/CPH": 963012,
    "TPRX / CPH": "TPRX IVRY SUR SEINE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100211,
    "TJ": "TJ CRETEIL",
    "Code TPRX/CPH": 963026,
    "TPRX / CPH": "TPRX ST MAUR DES FOSSES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100211,
    "TJ": "TJ CRETEIL",
    "Code TPRX/CPH": 963039,
    "TPRX / CPH": "TPRX NOGENT SUR MARNE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100211,
    "TJ": "TJ CRETEIL",
    "Code TPRX/CPH": 963067,
    "TPRX / CPH": "TPRX SUCY EN BRIE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100211,
    "TJ": "TJ CRETEIL",
    "Code TPRX/CPH": 963075,
    "TPRX / CPH": "TPRX VILLEJUIF"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100208,
    "TJ": "TJ EVRY-COURCOURONNES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100208,
    "TJ": "TJ EVRY-COURCOURONNES",
    "Code TPRX/CPH": 101200,
    "TPRX / CPH": "CPH ÉVRY-COURCOURONNES"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100208,
    "TJ": "TJ EVRY-COURCOURONNES",
    "Code TPRX/CPH": 101202,
    "TPRX / CPH": "CPH LONGJUMEAU"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100208,
    "TJ": "TJ EVRY-COURCOURONNES",
    "Code TPRX/CPH": 962996,
    "TPRX / CPH": "TPRX ETAMPES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100208,
    "TJ": "TJ EVRY-COURCOURONNES",
    "Code TPRX/CPH": 963014,
    "TPRX / CPH": "TPRX JUVISY SUR ORGE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100208,
    "TJ": "TJ EVRY-COURCOURONNES",
    "Code TPRX/CPH": 963017,
    "TPRX / CPH": "TPRX LONGJUMEAU"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100208,
    "TJ": "TJ EVRY-COURCOURONNES",
    "Code TPRX/CPH": 963043,
    "TPRX / CPH": "TPRX PALAISEAU"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100183,
    "TJ": "TJ FONTAINEBLEAU",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100183,
    "TJ": "TJ FONTAINEBLEAU",
    "Code TPRX/CPH": 101162,
    "TPRX / CPH": "CPH FONTAINEBLEAU"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100184,
    "TJ": "TJ MEAUX",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100184,
    "TJ": "TJ MEAUX",
    "Code TPRX/CPH": 101163,
    "TPRX / CPH": "CPH MEAUX"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100184,
    "TJ": "TJ MEAUX",
    "Code TPRX/CPH": 963015,
    "TPRX / CPH": "TPRX LAGNY SUR MARNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100185,
    "TJ": "TJ MELUN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100185,
    "TJ": "TJ MELUN",
    "Code TPRX/CPH": 101164,
    "TPRX / CPH": "CPH MELUN"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 915273,
    "TJ": "TJ PARIS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 915273,
    "TJ": "TJ PARIS",
    "Code TPRX/CPH": 915272,
    "TPRX / CPH": "CPH PARIS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100206,
    "TJ": "TJ SENS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 914815,
    "CA": "CA PARIS",
    "Code TJ": 100206,
    "TJ": "TJ SENS",
    "Code TPRX/CPH": 101198,
    "TPRX / CPH": "CPH SENS"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100159,
    "TJ": "TJ BAYONNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100159,
    "TJ": "TJ BAYONNE",
    "Code TPRX/CPH": 101122,
    "TPRX / CPH": "CPH BAYONNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100107,
    "TJ": "TJ DAX",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100107,
    "TJ": "TJ DAX",
    "Code TPRX/CPH": 101044,
    "TPRX / CPH": "CPH DAX"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100108,
    "TJ": "TJ MONT DE MARSAN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100108,
    "TJ": "TJ MONT DE MARSAN",
    "Code TPRX/CPH": 101045,
    "TPRX / CPH": "CPH MONT DE MARSAN"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100160,
    "TJ": "TJ PAU",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100160,
    "TJ": "TJ PAU",
    "Code TPRX/CPH": 101124,
    "TPRX / CPH": "CPH PAU"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100160,
    "TJ": "TJ PAU",
    "Code TPRX/CPH": 963040,
    "TPRX / CPH": "TPRX OLORON STE MARIE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100161,
    "TJ": "TJ TARBES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100021,
    "CA": "CA PAU",
    "Code TJ": 100161,
    "TJ": "TJ TARBES",
    "Code TPRX/CPH": 101125,
    "TPRX / CPH": "CPH TARBES"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100066,
    "TJ": "TJ LA ROCHELLE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100066,
    "TJ": "TJ LA ROCHELLE",
    "Code TPRX/CPH": 100983,
    "TPRX / CPH": "CPH ROCHEFORT"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100066,
    "TJ": "TJ LA ROCHELLE",
    "Code TPRX/CPH": 100984,
    "TPRX / CPH": "CPH LA ROCHELLE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100066,
    "TJ": "TJ LA ROCHELLE",
    "Code TPRX/CPH": 963055,
    "TPRX / CPH": "TPRX ROCHEFORT"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100199,
    "TJ": "TJ LA ROCHE SUR YON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100199,
    "TJ": "TJ LA ROCHE SUR YON",
    "Code TPRX/CPH": 101187,
    "TPRX / CPH": "CPH LA ROCHE SUR YON"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100199,
    "TJ": "TJ LA ROCHE SUR YON",
    "Code TPRX/CPH": 963001,
    "TPRX / CPH": "TPRX FONTENAY LE COMTE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100188,
    "TJ": "TJ NIORT",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100188,
    "TJ": "TJ NIORT",
    "Code TPRX/CPH": 101170,
    "TPRX / CPH": "CPH NIORT"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100188,
    "TJ": "TJ NIORT",
    "Code TPRX/CPH": 101171,
    "TPRX / CPH": "CPH THOUARS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100188,
    "TJ": "TJ NIORT",
    "Code TPRX/CPH": 962974,
    "TPRX / CPH": "TPRX BRESSUIRE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100201,
    "TJ": "TJ POITIERS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100201,
    "TJ": "TJ POITIERS",
    "Code TPRX/CPH": 101190,
    "TPRX / CPH": "CPH POITIERS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100201,
    "TJ": "TJ POITIERS",
    "Code TPRX/CPH": 962981,
    "TPRX / CPH": "TPRX CHATELLERAULT"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100200,
    "TJ": "TJ SABLES-D'OLONNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100200,
    "TJ": "TJ SABLES-D'OLONNE",
    "Code TPRX/CPH": 101188,
    "TPRX / CPH": "CPH SABLES-D'OLONNE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100067,
    "TJ": "TJ SAINTES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100067,
    "TJ": "TJ SAINTES",
    "Code TPRX/CPH": 100985,
    "TPRX / CPH": "CPH SAINTES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100029,
    "CA": "CA POITIERS",
    "Code TJ": 100067,
    "TJ": "TJ SAINTES",
    "Code TPRX/CPH": 963013,
    "TPRX / CPH": "TPRX JONZAC"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100127,
    "TJ": "TJ CHALONS EN CHAMPAGNE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100127,
    "TJ": "TJ CHALONS EN CHAMPAGNE",
    "Code TPRX/CPH": 101070,
    "TPRX / CPH": "CPH CHALONS EN CHAMPAGNE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100127,
    "TJ": "TJ CHALONS EN CHAMPAGNE",
    "Code TPRX/CPH": 101071,
    "TPRX / CPH": "CPH EPERNAY"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100051,
    "TJ": "TJ CHARLEVILLE MEZIERES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100051,
    "TJ": "TJ CHARLEVILLE MEZIERES",
    "Code TPRX/CPH": 100958,
    "TPRX / CPH": "CPH CHARLEVILLE MEZIERES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100051,
    "TJ": "TJ CHARLEVILLE MEZIERES",
    "Code TPRX/CPH": 963063,
    "TPRX / CPH": "TPRX SEDAN"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100128,
    "TJ": "TJ REIMS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100128,
    "TJ": "TJ REIMS",
    "Code TPRX/CPH": 101072,
    "TPRX / CPH": "CPH REIMS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100053,
    "TJ": "TJ TROYES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100016,
    "CA": "CA REIMS",
    "Code TJ": 100053,
    "TJ": "TJ TROYES",
    "Code TPRX/CPH": 100964,
    "TPRX / CPH": "CPH TROYES"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100086,
    "TJ": "TJ BREST",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100086,
    "TJ": "TJ BREST",
    "Code TPRX/CPH": 101013,
    "TPRX / CPH": "CPH BREST"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100086,
    "TJ": "TJ BREST",
    "Code TPRX/CPH": 101014,
    "TPRX / CPH": "CPH MORLAIX"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100086,
    "TJ": "TJ BREST",
    "Code TPRX/CPH": 963036,
    "TPRX / CPH": "TPRX MORLAIX"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100135,
    "TJ": "TJ LORIENT",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100135,
    "TJ": "TJ LORIENT",
    "Code TPRX/CPH": 101082,
    "TPRX / CPH": "CPH LORIENT"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100114,
    "TJ": "TJ NANTES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100114,
    "TJ": "TJ NANTES",
    "Code TPRX/CPH": 101055,
    "TPRX / CPH": "CPH NANTES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100088,
    "TJ": "TJ QUIMPER",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100088,
    "TJ": "TJ QUIMPER",
    "Code TPRX/CPH": 101015,
    "TPRX / CPH": "CPH QUIMPER"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100098,
    "TJ": "TJ RENNES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100098,
    "TJ": "TJ RENNES",
    "Code TPRX/CPH": 101030,
    "TPRX / CPH": "CPH RENNES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100098,
    "TJ": "TJ RENNES",
    "Code TPRX/CPH": 963002,
    "TPRX / CPH": "TPRX FOUGERES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100098,
    "TJ": "TJ RENNES",
    "Code TPRX/CPH": 963053,
    "TPRX / CPH": "TPRX REDON"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100076,
    "TJ": "TJ ST BRIEUC",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100076,
    "TJ": "TJ ST BRIEUC",
    "Code TPRX/CPH": 100995,
    "TPRX / CPH": "CPH GUINGAMP"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100076,
    "TJ": "TJ ST BRIEUC",
    "Code TPRX/CPH": 100996,
    "TPRX / CPH": "CPH ST BRIEUC"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100076,
    "TJ": "TJ ST BRIEUC",
    "Code TPRX/CPH": 963008,
    "TPRX / CPH": "TPRX GUINGAMP"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100099,
    "TJ": "TJ ST MALO",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100099,
    "TJ": "TJ ST MALO",
    "Code TPRX/CPH": 100994,
    "TPRX / CPH": "CPH DINAN"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100099,
    "TJ": "TJ ST MALO",
    "Code TPRX/CPH": 101031,
    "TPRX / CPH": "CPH ST MALO"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100099,
    "TJ": "TJ ST MALO",
    "Code TPRX/CPH": 962992,
    "TPRX / CPH": "TPRX DINAN"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100115,
    "TJ": "TJ ST NAZAIRE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100115,
    "TJ": "TJ ST NAZAIRE",
    "Code TPRX/CPH": 101056,
    "TPRX / CPH": "CPH ST NAZAIRE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100136,
    "TJ": "TJ VANNES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100011,
    "CA": "CA RENNES",
    "Code TJ": 100136,
    "TJ": "TJ VANNES",
    "Code TPRX/CPH": 101083,
    "TPRX / CPH": "CPH VANNES"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100063,
    "TJ": "TJ AURILLAC",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100063,
    "TJ": "TJ AURILLAC",
    "Code TPRX/CPH": 100980,
    "TPRX / CPH": "CPH AURILLAC"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100063,
    "TJ": "TJ AURILLAC",
    "Code TPRX/CPH": 963000,
    "TPRX / CPH": "TPRX ST FLOUR"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100157,
    "TJ": "TJ CLERMONT FERRAND",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100157,
    "TJ": "TJ CLERMONT FERRAND",
    "Code TPRX/CPH": 101119,
    "TPRX / CPH": "CPH CLERMONT FERRAND"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100157,
    "TJ": "TJ CLERMONT FERRAND",
    "Code TPRX/CPH": 101120,
    "TPRX / CPH": "CPH RIOM"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100157,
    "TJ": "TJ CLERMONT FERRAND",
    "Code TPRX/CPH": 963054,
    "TPRX / CPH": "TPRX RIOM"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100157,
    "TJ": "TJ CLERMONT FERRAND",
    "Code TPRX/CPH": 963069,
    "TPRX / CPH": "TPRX THIERS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100043,
    "TJ": "TJ CUSSET",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100043,
    "TJ": "TJ CUSSET",
    "Code TPRX/CPH": 100947,
    "TPRX / CPH": "CPH VICHY"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100043,
    "TJ": "TJ CUSSET",
    "Code TPRX/CPH": 963074,
    "TPRX / CPH": "TPRX VICHY"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100113,
    "TJ": "TJ LE PUY EN VELAY",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100113,
    "TJ": "TJ LE PUY EN VELAY",
    "Code TPRX/CPH": 101054,
    "TPRX / CPH": "CPH LE PUY EN VELAY"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100044,
    "TJ": "TJ MONTLUCON",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100044,
    "TJ": "TJ MONTLUCON",
    "Code TPRX/CPH": 100945,
    "TPRX / CPH": "CPH MONTLUCON"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100045,
    "TJ": "TJ MOULINS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100020,
    "CA": "CA RIOM",
    "Code TJ": 100045,
    "TJ": "TJ MOULINS",
    "Code TPRX/CPH": 100946,
    "TPRX / CPH": "CPH MOULINS"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100180,
    "TJ": "TJ DIEPPE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100180,
    "TJ": "TJ DIEPPE",
    "Code TPRX/CPH": 101157,
    "TPRX / CPH": "CPH DIEPPE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100084,
    "TJ": "TJ EVREUX",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100084,
    "TJ": "TJ EVREUX",
    "Code TPRX/CPH": 101005,
    "TPRX / CPH": "CPH BERNAY"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100084,
    "TJ": "TJ EVREUX",
    "Code TPRX/CPH": 101006,
    "TPRX / CPH": "CPH EVREUX"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100084,
    "TJ": "TJ EVREUX",
    "Code TPRX/CPH": 101007,
    "TPRX / CPH": "CPH LOUVIERS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100084,
    "TJ": "TJ EVREUX",
    "Code TPRX/CPH": 962972,
    "TPRX / CPH": "TPRX BERNAY"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100084,
    "TJ": "TJ EVREUX",
    "Code TPRX/CPH": 965406,
    "TPRX / CPH": "TPRX LOUVIERS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100181,
    "TJ": "TJ LE HAVRE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100181,
    "TJ": "TJ LE HAVRE",
    "Code TPRX/CPH": 101160,
    "TPRX / CPH": "CPH LE HAVRE"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100182,
    "TJ": "TJ ROUEN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100026,
    "CA": "CA ROUEN",
    "Code TJ": 100182,
    "TJ": "TJ ROUEN",
    "Code TPRX/CPH": 101161,
    "TPRX / CPH": "CPH ROUEN"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100033,
    "CA": "CA ST DENIS",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100033,
    "CA": "CA ST DENIS",
    "Code TJ": 941809,
    "TJ": "TJ MAMOUDZOU",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100033,
    "CA": "CA ST DENIS",
    "Code TJ": 941809,
    "TJ": "TJ MAMOUDZOU",
    "Code TPRX/CPH": 919416,
    "TPRX / CPH": "CPH MAMOUDZOU"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100033,
    "CA": "CA ST DENIS",
    "Code TJ": 100217,
    "TJ": "TJ ST DENIS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100033,
    "CA": "CA ST DENIS",
    "Code TJ": 100217,
    "TJ": "TJ ST DENIS",
    "Code TPRX/CPH": 101215,
    "TPRX / CPH": "CPH ST DENIS"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100033,
    "CA": "CA ST DENIS",
    "Code TJ": 100217,
    "TJ": "TJ ST DENIS",
    "Code TPRX/CPH": 962971,
    "TPRX / CPH": "TPRX ST BENOIT"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100033,
    "CA": "CA ST DENIS",
    "Code TJ": 100217,
    "TJ": "TJ ST DENIS",
    "Code TPRX/CPH": 963045,
    "TPRX / CPH": "TPRX ST PAUL"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100033,
    "CA": "CA ST DENIS",
    "Code TJ": 100218,
    "TJ": "TJ ST PIERRE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100033,
    "CA": "CA ST DENIS",
    "Code TJ": 100218,
    "TJ": "TJ ST PIERRE",
    "Code TPRX/CPH": 101216,
    "TPRX / CPH": "CPH ST PIERRE"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100192,
    "TJ": "TJ ALBI",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100192,
    "TJ": "TJ ALBI",
    "Code TPRX/CPH": 101176,
    "TPRX / CPH": "CPH ALBI"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100193,
    "TJ": "TJ CASTRES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100193,
    "TJ": "TJ CASTRES",
    "Code TPRX/CPH": 101177,
    "TPRX / CPH": "CPH CASTRES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100052,
    "TJ": "TJ FOIX",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100052,
    "TJ": "TJ FOIX",
    "Code TPRX/CPH": 100962,
    "TPRX / CPH": "CPH FOIX"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100052,
    "TJ": "TJ FOIX",
    "Code TPRX/CPH": 963005,
    "TPRX / CPH": "TPRX ST GIRONS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100194,
    "TJ": "TJ MONTAUBAN",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100194,
    "TJ": "TJ MONTAUBAN",
    "Code TPRX/CPH": 101180,
    "TPRX / CPH": "CPH MONTAUBAN"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100194,
    "TJ": "TJ MONTAUBAN",
    "Code TPRX/CPH": 962979,
    "TPRX / CPH": "TPRX CASTELSARRASIN"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 948313,
    "TJ": "TJ ST GAUDENS",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 948313,
    "TJ": "TJ ST GAUDENS",
    "Code TPRX/CPH": 101018,
    "TPRX / CPH": "CPH ST GAUDENS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100092,
    "TJ": "TJ TOULOUSE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100092,
    "TJ": "TJ TOULOUSE",
    "Code TPRX/CPH": 101019,
    "TPRX / CPH": "CPH TOULOUSE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100008,
    "CA": "CA TOULOUSE",
    "Code TJ": 100092,
    "TJ": "TJ TOULOUSE",
    "Code TPRX/CPH": 963037,
    "TPRX / CPH": "TPRX MURET"
  },
  {
    "Type de juridiction": "CA",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": "",
    "TJ": "",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100085,
    "TJ": "TJ CHARTRES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100085,
    "TJ": "TJ CHARTRES",
    "Code TPRX/CPH": 101009,
    "TPRX / CPH": "CPH CHARTRES"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100085,
    "TJ": "TJ CHARTRES",
    "Code TPRX/CPH": 101011,
    "TPRX / CPH": "CPH DREUX"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100085,
    "TJ": "TJ CHARTRES",
    "Code TPRX/CPH": 962995,
    "TPRX / CPH": "TPRX DREUX"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": 101203,
    "TPRX / CPH": "CPH BOULOGNE BILLANCOURT"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": 101204,
    "TPRX / CPH": "CPH NANTERRE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": 962960,
    "TPRX / CPH": "TPRX ANTONY"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": 962962,
    "TPRX / CPH": "TPRX ASNIERES SUR SEINE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": 962973,
    "TPRX / CPH": "TPRX BOULOGNE BILLANCOURT"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": 962986,
    "TPRX / CPH": "TPRX COLOMBES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": 962988,
    "TPRX / CPH": "TPRX COURBEVOIE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": 963050,
    "TPRX / CPH": "TPRX PUTEAUX"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100209,
    "TJ": "TJ NANTERRE",
    "Code TPRX/CPH": 963073,
    "TPRX / CPH": "TPRX VANVES"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100212,
    "TJ": "TJ PONTOISE",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100212,
    "TJ": "TJ PONTOISE",
    "Code TPRX/CPH": 101208,
    "TPRX / CPH": "CPH ARGENTEUIL"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100212,
    "TJ": "TJ PONTOISE",
    "Code TPRX/CPH": 101210,
    "TPRX / CPH": "CPH MONTMORENCY"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100212,
    "TJ": "TJ PONTOISE",
    "Code TPRX/CPH": 907248,
    "TPRX / CPH": "CPH PONTOISE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100212,
    "TJ": "TJ PONTOISE",
    "Code TPRX/CPH": 963006,
    "TPRX / CPH": "TPRX GONESSE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100212,
    "TJ": "TJ PONTOISE",
    "Code TPRX/CPH": 963033,
    "TPRX / CPH": "TPRX MONTMORENCY"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100212,
    "TJ": "TJ PONTOISE",
    "Code TPRX/CPH": 963059,
    "TPRX / CPH": "TPRX SANNOIS"
  },
  {
    "Type de juridiction": "TGI",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": "",
    "TPRX / CPH": ""
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": 101165,
    "TPRX / CPH": "CPH MANTES LA JOLIE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": 101166,
    "TPRX / CPH": "CPH POISSY"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": 101167,
    "TPRX / CPH": "CPH RAMBOUILLET"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": 101168,
    "TPRX / CPH": "CPH SAINT-GERMAIN-EN-LAYE"
  },
  {
    "Type de juridiction": "CPH",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": 101169,
    "TPRX / CPH": "CPH VERSAILLES"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": 963004,
    "TPRX / CPH": "TPRX SAINT-GERMAIN-EN-LAYE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": 963021,
    "TPRX / CPH": "TPRX MANTES LA JOLIE"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": 963048,
    "TPRX / CPH": "TPRX POISSY"
  },
  {
    "Type de juridiction": "TPRX",
    "Code Ca": 100027,
    "CA": "CA VERSAILLES",
    "Code TJ": 100186,
    "TJ": "TJ VERSAILLES",
    "Code TPRX/CPH": 963052,
    "TPRX / CPH": "TPRX RAMBOUILLET"
  }
]`

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    // remove juridiction start with ietls > 900000
    await models.TJ.destroy({
      where: {
        i_elst: {
          [Op.gte]: 900000,
        },
      },
      force: true,
    })

    // remove dupplicate juridiction
    const listDuplicateJurictions = (
      await models.TJ.findAll({
        attributes: ['i_elst', [fn('COUNT', col('i_elst')), 'count']],
        group: ['i_elst'],
        raw: true,
      })
    )
      .map((l) => ({ ...l, count: +l.count }))
      .filter((l) => l.count > 1)

    for (let i = 0; i < listDuplicateJurictions.length; i++) {
      const i_elst = listDuplicateJurictions[i].i_elst
      const list = await models.TJ.findAll({
        where: {
          i_elst,
        },
        raw: true,
      })

      const idsToRemove = list.filter((j) => j.population === null).map((j) => j.id)
      if (idsToRemove.length < list.length) {
        await models.TJ.destroy({
          where: {
            id: idsToRemove,
          },
          force: true,
        })
      }
    }

    // add category of TJ
    await models.TJ.update(
      {
        type: 'TGI',
      },
      {
        where: {
          parent_id: null,
        },
      }
    )

    // add tprox
    const t_prox = JSON.parse(T_PROX).filter((t) => t['Code TPRX/CPH'])
    for (let i = 0; i < t_prox.length; i++) {
      const tProxIelst = t_prox[i]['Code TPRX/CPH']
      const searchExistingTJ = await models.TJ.findOne({
        where: {
          i_elst: tProxIelst,
        },
      })

      if (searchExistingTJ === null) {
        const parent = await models.TJ.findOne({
          where: {
            i_elst: t_prox[i]['Code TJ'],
          },
          raw: true,
        })

        if (parent) {
          await models.TJ.create({
            i_elst: tProxIelst,
            label: t_prox[i]['TPRX / CPH'],
            type: t_prox[i]['Type de juridiction'],
            parent_id: parent.id,
          })
        }
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
