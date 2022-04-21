function etherst() {
  return 77;
}

export function extendParser(parser: any) {
  parser.setFunction("ETHERST", etherst);
  return parser;
}
