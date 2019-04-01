import chalk from 'chalk'

export default async () => {
  try {
    console.log(
      chalk.magenta.bold(
        'Welcome to the GraphQL Swiss Knife. Please select an option for your new build:'
      )
    )
  } catch (e) {
    console.log(e)
  }
}
