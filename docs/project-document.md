# Project Document Boundary

Completion evidence for the Project document deletion test.

`src/project-document/index.ts` owns eligible Markdown and YAML discovery,
dependency/build/version-control ignore rules, delimiter extraction, YAML
parsing, body extraction, mapping facts, and structured diagnostics. Validation
consumes those facts and retains only its required-field and mapping policy,
result rendering, counts, and exit-code selection.

The shared parsing corpus covers missing, unterminated, empty, malformed,
mapping, scalar, array, Markdown, and YAML-only inputs at the module interface.
Removing the module would force validation to recreate discovery, delimiter,
YAML, and diagnostic policy immediately; after the following search migration,
the same facts would have to be recreated in both commands. The module is
therefore a policy boundary rather than a forwarding helper.
