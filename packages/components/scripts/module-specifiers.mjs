// Shared module-specifier scanning for the component build scripts.
// Replaces comment interiors with spaces while preserving offsets and line
// structure, so module specifiers inside documentation examples are not
// mistaken for code. String literals are preserved because they may contain
// import-like text that still needs the quote-lookbehind guard;
// triple-slash reference directives stay intact because they are
// semantically relevant.

const MODULE_SPECIFIER_PATTERN =
  /((?<!["'])\bfrom\s*|(?<!["'])\bimport\s*\(\s*|(?<!["'])\bimport\s*|(?<!["'])\brequire\s*\(\s*)(["'])([^"'\n]+)\2/g

export function maskComments(text) {
  const characters = [...text]
  let state = "code"
  let index = 0
  while (index < characters.length) {
    const current = characters[index]
    const next = characters[index + 1] ?? ""
    if (state === "code") {
      if (current === "/" && next === "/") {
        // Keep triple-slash directives visible.
        const lineStart = text.lastIndexOf("\n", index) + 1
        const linePrefix = text.slice(lineStart, index)
        if (/^\s*$/.test(linePrefix) && text.startsWith("///", index)) {
          index += 3
          continue
        }
        state = "line"
        characters[index] = " "
        characters[index + 1] = " "
        index += 2
        continue
      }
      if (current === "/" && next === "*") {
        state = "block"
        characters[index] = " "
        characters[index + 1] = " "
        index += 2
        continue
      }
      if (current === '"' || current === "'" || current === "`") {
        state = "string"
        index += 1
        continue
      }
      index += 1
      continue
    }
    if (state === "line") {
      if (current === "\n") {
        state = "code"
      } else {
        characters[index] = " "
      }
      index += 1
      continue
    }
    if (state === "block") {
      if (current === "*" && next === "/") {
        characters[index] = " "
        characters[index + 1] = " "
        state = "code"
        index += 2
        continue
      }
      if (current !== "\n") {
        characters[index] = " "
      }
      index += 1
      continue
    }
    // string
    if (current === "\\") {
      index += 2
      continue
    }
    if (current === '"' || current === "'" || current === "`") {
      state = "code"
    }
    index += 1
  }
  return characters.join("")
}

// Finds import-like module specifier occurrences in code (comments masked)
// and reports their exact value positions in the original text.
export function findModuleSpecifierOccurrences(text) {
  const masked = maskComments(text)
  const occurrences = []
  MODULE_SPECIFIER_PATTERN.lastIndex = 0
  let match
  while ((match = MODULE_SPECIFIER_PATTERN.exec(masked)) !== null) {
    occurrences.push({
      specifier: match[3],
      valueStart: match.index + match[1].length + 1,
    })
  }
  return occurrences
}

export function isBareSpecifier(specifier) {
  return !specifier.startsWith(".") && !specifier.startsWith("/")
}

export function extractBareSpecifiers(text) {
  const specifiers = new Set()
  for (const occurrence of findModuleSpecifierOccurrences(text)) {
    if (isBareSpecifier(occurrence.specifier)) {
      specifiers.add(occurrence.specifier)
    }
  }
  return specifiers
}
