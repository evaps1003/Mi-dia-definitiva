(function (G) {
  "use strict";
  var Org = G.Org = G.Org || {};

  Org.PALETTE = [
    { id: "lavanda",   name: "Lavanda",   hex: "#D9CDEF" },
    { id: "menta",     name: "Menta",     hex: "#C5E7D8" },
    { id: "melocoton", name: "Melocot\u00f3n", hex: "#FBDCC6" },
    { id: "azul",      name: "Azul suave",hex: "#C7DEF2" },
    { id: "rosa",      name: "Rosa",      hex: "#F7D3E3" },
    { id: "limon",     name: "Lim\u00f3n", hex: "#F5ECC9" },
    { id: "arena",     name: "Arena",     hex: "#EFE2CF" },
    { id: "celeste",   name: "Celeste",   hex: "#CFF0F0" }
  ];

  // Emoticonos personalizados de Eva (PUA \uE000\u2013\uF8FF):
  // cada uno debe estar en img/emoji/<CODIGO>.svg
  // E001 diente · E002 cerdo · E003 cubiertos · E004 flor rosa · E005 fresa
  // E006 gota de agua · E007 libro · E008 pata blanca · E009 sobre · E00A sol · E00B tulipán
  Org.CUSTOM_EMOJIS = [
    "\uE001", "\uE002", "\uE003", "\uE004", "\uE005",
    "\uE006", "\uE007", "\uE008", "\uE009", "\uE00A", "\uE00B"
  ];

  // La paleta de emoticonos usa solo los personalizados (sin los de OpenMoji)
  Org.EMOJIS = Org.CUSTOM_EMOJIS;

  // Indexadas por Date.getDay(): 0 = Domingo … 6 = Sábado
  Org.WEEK_SHORT = ["Dom", "Lun", "Mar", "Mi\u00e9", "Jue", "Vie", "S\u00e1b"];
  Org.WEEK_NAMES = ["Domingo", "Lunes", "Martes", "Mi\u00e9rcoles", "Jueves", "Viernes", "S\u00e1bado"];
  Org.EDITOR_ORDER = [1, 2, 3, 4, 5, 6, 0];

  Org.MONTHS_FULL = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  Org.MONTHS_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

  // Índice por Date.getDay(): 0=Dom…6=Sáb
  Org.DAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

  Org.EMPTY_BLOCK = { id: null, weekday: 1, startMin: 540, endMin: 600, title: "", color: "#D9CDEF" };
  Org.EMPTY_HABIT = { id: null, title: "", icon: "\uE006", color: "#D9CDEF", sortPos: 0 };
  Org.EMPTY_TASK =  { id: null, title: "", dueDate: null, completed: 0, color: "#D9CDEF" };
})(window);