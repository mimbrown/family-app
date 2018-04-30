const Program = require('commander')

Program
  .version('0.0.1')
  .option('-s, --specs [JSON string]', 'a JSON specification of which tables from which schemas should be included')
  .option('-f, --specs-file [path]', 'a path to a JSON specification file')

Program.parse(process.argv)

let {specs, specsFile} = Program

if (specs) {
  specs = JSON.parse(specs)
} else if (specsFile) {
  specs = require(specsFile)
} else {
  throw new Error('You must specify either the --specs or --specs-file option')
}