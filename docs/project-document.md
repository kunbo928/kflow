# Project Document Boundary

Completion evidence for the Project document deletion test.

`src/project-document/index.ts` owns eligible Markdown and YAML discovery,
dependency/build/version-control ignore rules, delimiter extraction, YAML
parsing, body extraction, mapping facts, and structured diagnostics. Validation
consumes those facts and retains only its required-field and mapping policy,
result rendering, counts, and exit-code selection. Search consumes the same
facts and retains tolerant diagnostic handling, filters, full-text matching,
sorting, and text/JSON presentation.

The shared parsing corpus covers missing, unterminated, empty, malformed,
mapping, scalar, array, Markdown, and YAML-only inputs at the module interface.
Removing the module would force both search and validation to recreate
discovery, ignore rules, delimiter extraction, YAML parsing, body extraction,
mapping classification, document loading, and diagnostic facts. The module is
therefore a shared policy boundary rather than a forwarding helper.
