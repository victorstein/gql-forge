export default (len) => {
  var length = len || 30
  var string = 'abcdefghijklmnopqrstuvwxyz'
  var numeric = '0123456789'
  var punctuation = '!@#$%^&*()_+~`|}{[]\:;?><,./-='
  var password = ''
  var character = ''
  while (password.length < length) {
    let entity1 = Math.ceil(string.length * Math.random() * Math.random())
    let entity2 = Math.ceil(numeric.length * Math.random() * Math.random())
    let entity3 = Math.ceil(punctuation.length * Math.random() * Math.random())
    let hold = string.charAt(entity1)
    hold = (password.length % 2 === 0) ? (hold.toUpperCase()) : (hold)
    character += hold
    character += numeric.charAt(entity2)
    character += punctuation.charAt(entity3)
    password = character
  }
  password = password.split('').sort(() => { return 0.5 - Math.random() }).join('')
  return password.substr(0, len)
}