jsdoc index.js -d doc -R ./README.md
jsdoc2md -t src/jsdoc2md-template.hbs index.js > doc/index.md
