import '@babel/polyfill'
import init from './prompts/init'
import { initQuestions, dbQuestions, jwtQuestions, jwtCreationQuestions } from './prompts/questions'
import fileExists from './utils/fileExists'
import createFs from './utils/createFs'
import writeTofile from './utils/writeToFile'
import readFs from './utils/readFs'
import passwordGenerator from './utils/passwordGenerator'
import exec from './utils/exec'
import { env } from './files/commons'
import wait from './utils/wait'
import Spinner from './utils/spinner'

let spinner = Spinner('Checking if data file exists', 'yellow');

(async () => {
  try {
    // Clear the console
    console.clear()

    // Init the CLI
    init()

    // Ask first set of questions
    let answers = await initQuestions()

    // get the answers
    let { DATA, CONNECT_DB } = answers

    // Start Spinner
    spinner.start()

    // Check if data exists
    await fileExists(DATA)

    // stop Spinner
    await wait(2000, () => spinner.succeed(['File found successfully']))

    // Check if the user want to connect to a db
    if (CONNECT_DB) {
      var DbInfo = await dbQuestions()
    }

    // ask if we should create a JWT secret
    var createJWT = await jwtQuestions()

    // retreive jwt data
    var { JWT_SECRET, JWT_EXP } = createJWT

    // If user wants to input their own secret
    if (!JWT_SECRET) {
      let data = await jwtCreationQuestions()
      JWT_SECRET = data.JWT_SECRET
    } else {
      JWT_SECRET = passwordGenerator()
    }

    // Set Spinner
    spinner.color = 'yellow'
    spinner.text = 'Creating .env file'
    spinner.start()

    // create env file
    await writeTofile('.env', env({ ...DbInfo, jwt: JWT_SECRET, jwtExp: JWT_EXP }))

    // Stop Spinner continue the process
    await wait(1000, () => spinner.succeed(['.env file created successfully']))

    // Get .forgefile path
    let path = DATA.length ? `./${DATA}.forge` : `./data.forge`

    // Parse data.forge file
    let data = JSON.parse(await readFs(path))

    // Set Spinner
    spinner.color = 'yellow'
    spinner.text = 'Creating project files'
    spinner.start()

    // Create folder structure, gitignore, readme and webpackconfig
    await createFs(data)

    // Stop Spinner continue the process
    await wait(1500, () => spinner.succeed(['Project structure created successfully']))

    // Set Spinner
    spinner.color = 'yellow'
    spinner.text = 'Initializing the project using foldername'
    spinner.start()

    // create npm project
    await exec(`npm init -y`)

    // Stop Spinner continue the process
    await wait(1500, () => spinner.succeed(['Initialization completed successfully']))

    // Set Spinner
    spinner.color = 'yellow'
    spinner.text = 'Updating package.json with the new scripts'
    spinner.start()

    // Update package.json Scripts, nodemon config and main
    let packageJson = JSON.parse(await readFs('./package.json'))

    packageJson.scripts = {
      start: 'node ./dist/server.bundle.js',
      dev: 'webpack | nodemon dist/server.bundle.js',
      build: 'webpack'
    }

    packageJson.nodemonConfig = {
      'ignore': [
        'src/*'
      ]
    }

    packageJson.main = 'dist/server.bundle.js'

    await writeTofile('package.json', JSON.stringify(packageJson, null, 2))

    // Stop Spinner continue the process
    await wait(1500, () => spinner.succeed(['Package.json updated successfully']))

    // Set Spinner
    spinner.color = 'yellow'
    spinner.text = 'Installing main dependencies'
    spinner.start()

    // install dependencies
    await exec(`npm install @babel/polyfill apollo-server-express bcrypt dotenv express graphql jsonwebtoken mongoose`)

    // Stop Spinner continue the process
    spinner.succeed(['Main dependencies installed successfully'])

    // Set Spinner
    spinner.color = 'yellow'
    spinner.text = 'Installing development dependencies'
    spinner.start()

    // isntall dev dependencies
    await exec(`npm install -D @babel/core @babel/preset-env babel-loader nodemon standard webpack webpack-cli webpack-node-externals`)

    // Stop Spinner continue the process
    spinner.succeed(['Development dependencies installed successfully'])

    // Ready
    console.log('Project created successfully, start the project with npm run dev')
  } catch (e) {
    spinner.start()
    console.error(e)
  }
})()
