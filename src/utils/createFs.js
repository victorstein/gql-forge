import exec from './exec'
import writeTofile from './writeToFile'
import {
  readme,
  gitignore,
  webpack,
  server
} from '../files/commons'
import { index, model } from '../files/models'
import { typeDefIndex, typeDefRoot, typeDef } from '../files/typedefs'
import { resolverIndex, resolverDeafult, resolver } from '../files/resolver'
// import { emailValidator, jwtAuth, jwtRegister, utilsIndex } from '../files/utils'
import * as utils from '../files/utils'
import { contactForm, emailVerification, passwordReset } from '../files/templates'

export default (data) => new Promise(async (resolve, reject) => {
  try {
    // extrac the data needed for file system creation
    let models = Object.entries(data).map(u => u[0].charAt(0).toUpperCase() + u[0].slice(1))
    let modelsLowerCase = Object.entries(data).map(u => u[0].toLowerCase())

    // Create folder struccture
    await exec('mkdir src')
    await exec('mkdir dist')
    await exec('mkdir src\\models')
    await exec('mkdir src\\resolvers')
    await exec('mkdir src\\typeDefs')
    await exec('mkdir src\\utils')
    await exec('mkdir src\\utils\\templates')
    await writeTofile('.gitignore', gitignore())
    await writeTofile('README.md', readme())
    await writeTofile('webpack.config.js', webpack())

    // create server file
    await writeTofile('./src/server.js', server(models))

    // create models index file
    await writeTofile('./src/models/index.js', index(models))

    // Create typedefs index file
    await writeTofile('./src/typeDefs/index.js', typeDefIndex(models))

    // Create typedefs root file file
    await writeTofile('./src/typeDefs/root.js', typeDefRoot())

    // create utils Array
    let utilsList = []

    // Create utils
    for (let util of Object.entries(utils)) {
      if (util[0] !== 'utilsIndex') {
        await writeTofile(`./src/utils/${util[0]}.js`, utils[util[0]]())
        utilsList.push(util[0])
      }
    }

    // Create utils index
    await writeTofile('./src/utils/index.js', utils.utilsIndex(utilsList))

    // Create email templates
    await writeTofile('./src/utils/templates/contactForm.js', contactForm())
    await writeTofile('./src/utils/templates/emailVerification.js', emailVerification())
    await writeTofile('./src/utils/templates/passwordReset.js', passwordReset())

    // Create resolvers index file
    await writeTofile('./src/resolvers/index.js', resolverIndex(modelsLowerCase))

    // Create default resolvers file
    await writeTofile('./src/resolvers/defaultModels.js', resolverDeafult(utilsList))

    // Create models
    for (let modelData of Object.entries(data)) {
      let modelName = modelData[0].charAt(0).toUpperCase() + modelData[0].slice(1)
      let modelnameLowerCase = modelData[0].toLowerCase()

      await writeTofile(`./src/models/${modelName}.js`, model(modelName, modelData[1]))
      await writeTofile(`./src/typeDefs/${modelnameLowerCase}.js`, typeDef(modelName, modelData[1]))
      await writeTofile(`./src/resolvers/${modelnameLowerCase}.js`, resolver(modelName, modelData[1], utilsList))
    }

    resolve()
  } catch (e) {
    reject(e)
  }
})
