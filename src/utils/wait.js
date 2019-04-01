export default (time, callback) => {
  return new Promise((resolve, reject) => setTimeout(_ => {
    callback()
    resolve()
  }, time))
}
