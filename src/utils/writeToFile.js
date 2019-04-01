import fs from 'fs'

export default (file, content) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, content, (err) => {
      if (err) reject(err)
      resolve()
    })
  })
}
