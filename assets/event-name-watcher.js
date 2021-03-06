const fs = require('fs')
const { couldStartTrivia } = require('typescript')

const sourceFilePath = './js/event-names.ts'
const targetFilePath = "../lib/event_name.ex"

console.log("watcher started for event-names...")

fs.watch(sourceFilePath, () => {
    console.log('file changed')
    fs.readFile(sourceFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        // just the data between { and } of the 'enum'
        const events = data.substring(
            data.indexOf("{") + 1,
            data.lastIndexOf("}")
        ).split("\n")
            .map(line => {
                // ignore empty lines and comments
                if (line.match(/^\s*\/\//)) {
                    return null
                } else if (line.match(/^[\s\t\n]*$/)) {
                    return null
                } else {
                    return line
                }
            })
            .filter(line => line !== null)
            .map(line => {
                let [name, num] = line.split(' = ')
                num = num.replace(/[^0-9]/g, '')
                name = name.replace(/[^a-z_]/g, '')
                return [name, num]
            })


        const functions = events.reduce((acc, event) => {
            acc.int_to_atoms.push(`  def int_to_atom(${event[1]}), do: :${event[0]}`)
            acc.atom_to_ints.push(`  def atom_to_int(:${event[0]}), do: ${event[1]}`)
            return acc
        }, { int_to_atoms: [], atom_to_ints: [] })

        let newContent = `
# UPDATE event-names.ts INSTEAD OF THIS FILE
# THIS FILE IS AUTOGENERATED, DO NOT MANUALLY UPDATE
#
defmodule EventName do

${functions.int_to_atoms.join("\n")}

${functions.atom_to_ints.join("\n")}

end
        `
        console.log(newContent)
        fs.writeFileSync(targetFilePath, newContent, { mode: 0o644 })
    });


})