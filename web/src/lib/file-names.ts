// extension is a file name's lower case extension without its dot, or an empty
// string when the name has none. Sorting a listing by type and picking the
// glyph for an entry are the same question, so both read the name here.
export function extension(name: string): string {
  const index = name.lastIndexOf('.');
  return index > 0 ? name.slice(index + 1).toLowerCase() : '';
}
