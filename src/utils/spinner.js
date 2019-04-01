import cliSpinners from 'cli-spinners'
import Ora from 'ora'

const spinner = (text, color) => {
  return new Ora({
    text,
    spinner: cliSpinners.bouncingBar,
    color,
    indent: 5
  })
}

export default spinner
