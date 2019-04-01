import inquirer from 'inquirer'

export const initQuestions = () => {
  const questions = [
    {
      name: 'DATA',
      type: 'input',
      message: 'What is the name of the data file without extension (defaults to data.forge)?'
    },
    {
      name: 'CONNECT_DB',
      type: 'list',
      message: 'Would you like to setup a mongoDB connection?',
      choices: [
        'Yes',
        'No'
      ],
      filter: (val) => {
        return val === 'Yes'
      }
    }
  ]
  return inquirer.prompt(questions)
}

export const dbQuestions = () => {
  const questions = [
    {
      name: 'DB_USER',
      type: 'input',
      message: 'What is the database username?'
    },
    {
      name: 'DB_PASS',
      type: 'password',
      message: 'What is the database password?'
    },
    {
      name: 'DB_URI',
      type: 'input',
      message: 'What is the database URI?'
    }
  ]
  return inquirer.prompt(questions)
}

export const jwtQuestions = () => {
  const questions = [
    {
      name: 'JWT_SECRET',
      type: 'list',
      message: 'Would you like us to create a jwt secret for you?',
      choices: [
        'Yes',
        'No'
      ],
      filter: (val) => {
        return val === 'Yes'
      }
    },
    {
      name: 'JWT_EXP',
      type: 'input',
      message: 'What would be the expiration of the JWT token (defaults to 20m)? e.g 2h, 2days, 2m'
    }
  ]
  return inquirer.prompt(questions)
}

export const jwtCreationQuestions = () => {
  const questions = [
    {
      name: 'JWT_SECRET',
      type: 'password',
      message: 'What is your jwt secret?'
    }
  ]
  return inquirer.prompt(questions)
}
