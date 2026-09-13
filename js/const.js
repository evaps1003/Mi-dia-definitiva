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

  // Emoticonos personalizados (PUA \uE000–\uF8FF):
  // cada uno debe estar en img/emoji/<CODIGO>.svg (p.ej. E001.svg = icono-diente)
  Org.CUSTOM_EMOJIS = ["\uE001"];

  Org.EMOJIS = Org.CUSTOM_EMOJIS.concat([
    "\uD83D\uDCA7","\uD83D\uDCD6","\uD83C\uDFC3","\uD83E\uDDD8","\uD83E\uDD57","\uD83D\uDE34",
    "\u270D\uFE0F","\uD83C\uDFB8","\uD83C\uDFCB","\uD83D\uDEB6","\uD83C\uDFA8","\uD83D\uDDE3\uFE0F",
    "\u2615","\uD83C\uDF19","\uD83D\uDC8A","\uD83D\uDEBF","\uD83E\uDDF9","\uD83D\uDE4F",
    "\uD83C\uDFAF","\uD83E\uDDE0","\uD83D\uDC36","\uD83C\uDF31","\uD83E\uDDB7","\uD83D\uDC5F",
    "\uD83C\uDF43","\uD83C\uDF9E\uFE0F",
    "\uD83C\uDF4E","\uD83C\uDF73","\uD83E\uDD5B","\uD83D\uDCA4",
    "\uD83E\uDDB6","\uD83D\uDECC","\uD83C\uDF7D\uFE0F",
    "\u2728","\u2B50","\uD83C\uDF3C","\uD83C\uDF37","\uD83D\uDC96","\uD83E\uDD0D","\u2601",
    "\uD83E\uDEB7","\uD83E\uDEA5","\uD83D\uDED2","\uD83E\uDE9B","\uD83D\uDCBB","\uD83D\uDCDE",
    "\uD83E\uDEE7","\uD83D\uDE80","\u2708\uFE0F",
    "\uD83D\uDE0A"]);

  // Indexadas por Date.getDay(): 0 = Domingo … 6 = Sábado
  Org.WEEK_SHORT = ["Dom", "Lun", "Mar", "Mi\u00e9", "Jue", "Vie", "S\u00e1b"];
  Org.WEEK_NAMES = ["Domingo", "Lunes", "Martes", "Mi\u00e9rcoles", "Jueves", "Viernes", "S\u00e1bado"];
  Org.EDITOR_ORDER = [1, 2, 3, 4, 5, 6, 0];

  Org.MONTHS_FULL = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  Org.MONTHS_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

  // Índice por Date.getDay(): 0=Dom…6=Sáb
  Org.DAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

  Org.EMPTY_BLOCK = { id: null, weekday: 1, startMin: 540, endMin: 600, title: "", color: "#D9CDEF" };
  Org.EMPTY_HABIT = { id: null, title: "", icon: "\uD83D\uDCA7", color: "#D9CDEF", sortPos: 0 };
  Org.EMPTY_TASK =  { id: null, title: "", dueDate: null, completed: 0, color: "#D9CDEF" };
})(window);