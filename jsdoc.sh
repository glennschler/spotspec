jsdoc lib/*.js -d doc
jsdoc2md -t src/jsdoc2md-template.hbs lib/*.js > doc/index.md
