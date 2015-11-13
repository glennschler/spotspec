rm -r -f doc/*
jsdoc lib/spotspec.js -d doc
jsdoc2md -t src/jsdoc2md-template.hbs lib/spotspec.js > doc/index.md
