
import { exec } from 'child_process'

export default async (command) => {
  return new Promise((resolve, reject) => {
    // Create the project
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }

      resolve(stdout)
    })
  })
}
