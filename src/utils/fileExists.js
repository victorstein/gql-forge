import fs from 'fs'

export default (name) => {
  const path = name.length ? `./${name}.forge` : `./data.forge`

  return new Promise((resolve, reject) => {
    fs.access(path, fs.F_OK, (err) => {
      if (err) {
        reject(err.message)
      }

      resolve()
    })
  })
}
