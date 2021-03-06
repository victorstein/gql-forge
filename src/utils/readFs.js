import fs from 'fs'

export default (file) => new Promise((resolve, reject) => {
  fs.readFile(file, 'utf8', (err, contents) => {
    if (err) { reject(err) }
    resolve(contents)
  })
})
