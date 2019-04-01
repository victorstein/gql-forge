export const utilsIndex = (utils) => `
  ${utils.map(u => `
  import ${u} from './${u}'`).toString().replace(/,/g, '\n')}

  export default {
    ${utils.toString().replace(/,/g, ',\n')}
  }
`

export const emailValidator = () => {
  return (`
    export default (email) => {
      let re = /^(([^<>()\\\\.,;:\s@"]+(\.[^<>()\\\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return re.test(String(email).toLowerCase())
    }
  `)
}

export const jwtAuth = () => {
  return (`
    import jwt from 'jsonwebtoken'
    import { config } from 'dotenv'
    import jwtRegister from './jwtRegister'
    import pwAuth from './pwAuth'
    
    config()
    const { JWT_SECRET, CLOSE_TO_EXPIRE } = process.env
    
    export default (token, hashedUser) => {
      // Split token from bearer
      token = token.split(' ')[1]
    
      // Asign default value to hashedUser
      hashedUser = (hashedUser) ? hashedUser : 'empty'
    
      return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
          if (err) {
            reject(err)
          }
    
          try {
            let expiryTime = decoded.exp
            let currentTime = Date.now() / 1000
            let closeToExpire = ((expiryTime - currentTime) / 60 < CLOSE_TO_EXPIRE)
    
            let validPw = await pwAuth(decoded.id, hashedUser)
    
            if (closeToExpire && validPw) {
              decoded.newToken = await jwtRegister({ id: decoded.id, role: decoded.role })
            }
    
            resolve(decoded)
          } catch (e) {
            reject(e)
          }
    
        })
      })
    }
  `)
}

export const jwtRegister = () => {
  return (`
    import jwt from 'jsonwebtoken'
    import { config } from 'dotenv'

    config()
    const { JWT_SECRET, JWT_EXPIRATION } = process.env

    export default (payload) => {
      return new Promise((resolve, reject) => {
        jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION }, (err, token) => {
          if (err) {
            reject(err)
          }
          resolve(token)
        })
      })
    }
  `)
}

export const pwAuth = () => {
  return (`
    import bcrypt from 'bcrypt'

    export default async (pw, hash) => {
      return new Promise((resolve, reject) => {
        try {
          bcrypt.compare(pw, hash).then((res) => {
            resolve(res)
          })
        } catch (e) {
          reject(e)
        }
      })
    }
  `)
}

export const pwHash = () => {
  return (`
    import bcrypt from 'bcrypt'

    export default (pw) => {
      return new Promise((resolve, reject) => {
        bcrypt.hash(pw, 10, (e, hash) => {
          if (e) { reject(e) }
          resolve(hash)
        })
      })
    }
  `)
}

export const pwMinReq = () => {
  return (`
    export default (pw) => {
      let re = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
      return re.test(String(pw))
    }
  `)
}

export const sendEmail = () => {
  return (`
    import { config } from 'dotenv'
    import emailVerification from './templates/emailVerification'
    import passwordReset from './templates/passwordReset'
    import contactForm from './templates/contactForm'

    config()
    const { CONTACT_FORM_EMAIL, MAILGUN_KEY, MAILGUN_DOMAIN, PORT, WEBSITE_DOMAIN, NODE_ENV } = process.env

    export default (user, type) => {
      return new Promise((resolve, reject) => {
        let { email, verificationCode, firstName, lastName, pwResetReq, message } = user
        let adminEmail = CONTACT_FORM_EMAIL
        let apiKey = MAILGUN_KEY
        let domain = MAILGUN_DOMAIN
        let webDomain = NODE_ENV !== 'production' ? \`http://localhost:\${PORT}\` : WEBSITE_DOMAIN
        let mailgun = require('mailgun-js')({ apiKey, domain })
        let template = () => {
          if (!type) { reject(new Error('No email type provided')) }
          switch (type) {
            case 'verification':
              return emailVerification(webDomain, verificationCode)
            case 'reset':
              return passwordReset(webDomain, pwResetReq)
            case 'contactForm':
              return contactForm(email, message, firstName)
            default:
              reject(new Error('Invalid email type provided'))
          }
        }
        let subject = () => {
          switch (type) {
            case 'verification':
              return \`Welcome to Easy Immigration \${firstName} \${lastName}\`
            case 'reset':
              return 'Password reset link'
            case 'contactForm':
              return 'Contact from website'
            default:
              reject(new Error('Invalid email type provided'))
          }
        }

        var data = {
          from: 'do-not-reply@easyimmigration.net',
          to: type === 'contactForm' ? adminEmail : email,
          subject: subject(),
          html: template()
        }

        mailgun.messages().send(data, function (error, body) {
          if (error) {
            if (error.message.includes('valid address')) {
              reject(new Error('Please enter a valid email address'))
            }
            reject(error)
          }
          resolve(body)
        })
      })
    }
  `)
}

export const index = () => {
  return (`
    import pwHash from './pwHash'
    import pwAuth from './pwAuth'
    import jwtRegister from './jwtRegister'
    import jwtAuth from './jwtAuth'
    import pwMinReq from './pwMinReq'
    import sendEmail from './sendEmail'
    import pdfUtils from './pdfUtils'
    import emailValidator from './emailValidator'
    
    export default {
      pwHash,
      pwAuth,
      jwtRegister,
      jwtAuth,
      isEmailValid,
      pwMinReq,
      sendEmail,
      emailValidator
    }
  `)
}