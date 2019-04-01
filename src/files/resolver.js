import Pluralize from 'pluralize'

export const resolverIndex = (models) => `
  ${models.map(u => `import ${u} from './${u}'`).toString().replace(/,/g, '\n')}
  import defaultModels from './defaultModels'

  export default [
    defaultModels,
    ${models.toString()}
  ]
`

export const resolverDeafult = (utilsList) => `
import { ApolloError, AuthenticationError } from 'apollo-server-express'
import utils from '../utils'

const { ${utilsList.toString()} } = utils

export default {
  Query: {
    me: async (root, args, { token, User }, info) => {
      try {
        // Check if the request contains a token
        if (!token) { throw new AuthenticationError(\`Unauthenticated\`) }

        // If request contains a token validate with jwt
        let payload = await jwtAuth(token)

        // get userInfo
        return User.findById(payload.id)
      } catch (e) {
        throw new ApolloError(\`\${e.message}\`)
      }
    }
  },
  Mutation: {
    tokenRevision: async (root, { token, hs }, context, info) => {
      try {
        // Check if the request contains a token
        if (!token) { throw new AuthenticationError(\`Unauthenticated\`) }

        // If request contains a token validate with jwt
        let payload = await jwtAuth(token, hs)

        return { token: payload.newToken, hs }
      } catch (e) {
        throw new ApolloError(\`\${e.message}\`)
      }
    },
    requestPwReset: async (root, { email }, { User }, info) => {
      try {
        // Check if the request contains an Email
        if (!email) { throw new AuthenticationError(\`No Email Provided\`) }

        // If request contains an email validate against database
        let user = await User.findOne({ email }).exec()

        if (!user) { return false }

        // If user found, retreive password and re-hash
        let pwResetReq = await pwHash(user.password)

        // set the pwResetReq to the re-hashed pw
        user.set({ pwResetReq })
        await user.save()

        // Send PW Reset Email
        await sendEmail(user, 'reset')

        return 'if your email exists password reset will be sent'
      } catch (e) {
        throw new ApolloError(\`\${e.message}\`)
      }
    },
    resetPassword: async (root, { hash, newPassword }, { User }, info) => {
      try {
        // Check if the request contains an Email
        if (!hash) { throw new AuthenticationError(\`No code Provided\`) }

        // If request contains an email validate against database and retreive payload
        let user = await User.findOne({ pwResetReq: hash }).exec()
        if (!user) { throw new Error('Unable to find the record at this time') }

        // Validate if password fulfills minimum requirements
        if (!pwMinReq(newPassword)) {
          throw new Error(\`
            password does not meet the minimmum requirements:
            * At least one upper case English letter
            * At least one lower case English letter
            * At least one digit
            * At least one special character
            * Minimum eight in length
          \`)
        }

        // Hash new password
        let password = await pwHash(newPassword)

        // re-hash password
        let pwResetReq = await pwHash(password)

        // Set and save user
        user.set({ password, pwResetReq })
        await user.save()

        return 'Password reset successfully'
      } catch (e) {
        throw new ApolloError(\`Error while updating: \${e.message}\`)
      }
    },
    signUp: async (root, { email, firstName, lastName, password }, { User }, info) => {
      try {
        // Check if email is already taken
        let emailInUse = await User.findOne({ email }).exec()
        if (emailInUse) { throw new Error('Email already in use') }

        // Validate if email has a valid format
        if (!isEmailValid(email)) { throw new Error('Invalid email address') }

        // Validate if password fulfills minimum requirements
        if (!pwMinReq(password)) {
          throw new Error(\`Password doesn't meet the minimum requirements\`)
        }

        // Hash the password using bcrypt
        password = await pwHash(password)
        let newUser = new User({ email, firstName, lastName, password, role: 'user', accountVerified: false })

        // Save and return user
        let newuser = await newUser.save()

        // Create Hash for verification and remove invalid characters
        let verificationCode = await pwHash(newuser.password)

        // Assign the verification code
        newuser.set({ verificationCode })

        // Send email with verification code
        await sendEmail(newUser, 'verification')

        // save the new data
        return newuser.save()
      } catch (e) {
        throw new ApolloError(\`\${e.message}\`)
      }
    },
    login: async (root, { email, password, accountVerified }, { User }, info) => {
      try {
        // Check if the user exist using the email
        let user = await User.findOne({ email }).exec()
        if (!user) { throw new Error('Invalid email or password') }

        // Validate password using bcrypt
        let validPw = await pwAuth(password, user.password)
        if (!validPw) { throw new Error('Invalid email or password') }

        // Validate if user account Verified
        if (!user.accountVerified) { throw new Error('The account has not been verified yet. Please check your email') }

        // If password and account verified send payload to jwt and strore token
        let token = await jwtRegister({ id: user['_id'], role: user.role })

        // Generate handshake
        let hs = await pwHash(String(user['_id']))

        // Return token
        return { token, hs }
      } catch (e) {
        throw new AuthenticationError(\`\${e.message}\`)
      }
    }
  }
}
`

export const resolver = (model, data, utilsList) => {
  let parameters = (resolve) => {
    let checkIfArguments = resolve.includes('(')
    if (checkIfArguments) {
      let params = resolve.split(',')
      params = params.map(u => u.split(':')[0])
      params = params.map(u => u.replace(/[()]/g, ''))
      return params.toString()
    } else {
      return 'args'
    }
  }

  let defaultScalarTypes = ['String', 'Int', 'Boolean', 'ID']
  let filteredTypes = Object.entries(data.type).reduce((x, u) => {
    if (!defaultScalarTypes.some(scalar => u[1].includes(scalar))) {
      x[u[0]] = u[1]
    }
    return x
  }, {})

  let minReq = ({ type }) => {
    let defaultScalarTypes = ['String', 'Int', 'Boolean', 'ID']
    let filteredTypes = Object.entries(type).reduce((x, u) => {
      if (u[1].includes('!') && defaultScalarTypes.some(scalar => u[1].includes(scalar))) {
        x.push(u[0])
      }
      return x
    }, [])
    return filteredTypes.toString().replace(/,/g, ', ')
  }

  let getParams = ({ type }) => {
    let defaultScalarTypes = ['String', 'Int', 'Boolean', 'ID']
    let filteredTypes = Object.entries(type).reduce((x, u) => {
      if (defaultScalarTypes.some(scalar => u[1].includes(scalar))) {
        x.push(u[0])
      }
      return x
    }, [])
    return filteredTypes.toString().replace(/,/g, ', ')
  }

  return (`
      import { ApolloError, AuthenticationError } from 'apollo-server-express'
      import utils from '../utils'

      const { ${utilsList.toString()} } = utils

      export default {
        ${
    Object.entries(filteredTypes).length
      ? `
      ${model}: {
        ${Object.entries(filteredTypes).map(u => `
          ${u[1].includes('[')
      ? `${u[0]}: async (root, args, { ${model.charAt(0).toUpperCase() + model.slice(1)}, token }, info) => {
      try {
        // Check if the request contains a token
        if (!token) { throw new AuthenticationError(\`Unauthenticated\`) }
  
        // If token received check its validity and retreive payload
        await jwtAuth(token)
  
        // Retreive all sections with the requested id
        return ${model.charAt(0).toUpperCase() + model.slice(1)}.findById(root.${model.toLowerCase()}).exec()
      } catch (e) {
        throw new ApolloError(e)
      }
    }`
      : `${u[0]}: async (root, args, { ${model.charAt(0).toUpperCase() + model.slice(1)}, token }, info) => {
      try {
        // Check if the request contains a token
        if (!token) { throw new AuthenticationError(\`Unauthenticated\`) }
  
        // If token received check its validity and retreive payload
        await jwtAuth(token)
  
        // Retreive all sections with the requested id
        return ${model.charAt(0).toUpperCase() + model.slice(1)}.find({ '_id': { $in: root.${model.toLowerCase()} } }).exec()
      } catch (e) {
        throw new ApolloError(e)
      }
    }`}
        `)} 
      },
      `
      : ''
    }
        Query: {
          ${model.toLowerCase()}: async (root, { id }, { ${model.charAt(0).toUpperCase() + model.slice(1)}, token }, info) => {
            try {
              // verify if token is valid
              await jwtAuth(token)
  
              // Retreive data by id
              let ${model.toLowerCase()} = await ${model.charAt(0).toUpperCase() + model.slice(1)}.findById(id).exec()

              // Check if ${model.toLowerCase()} exists
              if (!${model.toLowerCase()}) { throw new Error('${model.toLowerCase()} not found with that ID') }

              // Return the ${model.toLowerCase()}
              return ${model.toLowerCase()}
            } catch (e) {
              throw new ApolloError(e.message)
            }
          },
          ${Pluralize(model.toLowerCase())}: async (root, args, { ${model.charAt(0).toUpperCase() + model.slice(1)}, token }, info) => {
            try {
              // verify if token is valid
              await jwtAuth(token)
  
              // Retreive data by id
              let ${model.toLowerCase()} = await ${model.charAt(0).toUpperCase() + model.slice(1)}.find().exec()

              // Check if ${model.toLowerCase()} exists
              if (!${model.toLowerCase()}.length) { throw new Error('${model.toLowerCase()} not found with that ID') }

              // Return the ${model.toLowerCase()}
              return ${model.toLowerCase()}
            } catch (e) {
              throw new ApolloError(e.message)
            }
          },
          ${Object.entries(data.query).map(u => `
            ${u[0]}: async (root, ${parameters(u[1])}, { token }, info) => {
              try {
                ${u[1].split('$')[1]
      ? u[1].split('$')[1].includes('auth')
        ? `// verify if token is valid
                  await jwtAuth(token)`
        : ''
      : ''}
                /*
                  WRITE YOU BUSINESS LOGIC HERE
                */
              } catch (e) {
                throw new ApolloError(e.message)
              }
          }`)}
        },
        Mutation: {
          create${model.charAt(0).toUpperCase() + model.slice(1)}: async (root, args, { ${model.charAt(0).toUpperCase() + model.slice(1)}, token }, info) => {
            try {
              // verify if token is valid
              let payload = await jwtAuth(token)

              // Check which fields to create inside args
              args = Object.entries(args).reduce((x, u) => {
                if (u[1]) { x[u[0]] = u[1] }
                return x
              }, {})

              // Create new ${model.toLowerCase()}
              let ${model.toLowerCase()} = new ${model.charAt(0).toUpperCase() + model.slice(1)}(args)

              // Save the new ${model.toLowerCase()}
              return ${model.toLowerCase()}.save()
            } catch (e) {
              throw new ApolloError(e.message)
            }
          },
          update${model.charAt(0).toUpperCase() + model.slice(1)}: async (root, args, { ${model.charAt(0).toUpperCase() + model.slice(1)}, token }, info) => {
            try {
              // verify if token is valid
              let payload = await jwtAuth(token)

              // Retreive the model by ID
              let ${model.toLowerCase()} = await ${model.charAt(0).toUpperCase() + model.slice(1)}.findById(id).exec()

              // Return error if model not found
              if (!${model.toLowerCase()}) { throw new Error('Unable to find a ${model.toLowerCase()} with that id') }

              // Check which fields to update inside args
              args = Object.entries(args).reduce((x, u) => {
                if (u[1]) { x[u[0]] = u[1] }
                return x
              }, {})

              // Once verified make the corresponding changes
              ${model.toLowerCase()}.set(args)

              // Save and return the changes
              return ${model.toLowerCase()}.save()
            } catch (e) {
              throw new ApolloError(e.message)
            }
          },
          delete${model.charAt(0).toUpperCase() + model.slice(1)}: async (root, { id }, { ${model.charAt(0).toUpperCase() + model.slice(1)}, token }, info) => {
            try {
              // verify if token is valid
              let payload = await jwtAuth(token)

              // Retreive the model by ID
              let ${model.toLowerCase()} = await ${model.charAt(0).toUpperCase() + model.slice(1)}.findById(id).exec()

              // Return error if model not found
              if (!${model.toLowerCase()}) { throw new Error('Unable to find a ${model.toLowerCase()} with that id') }

              // If model found then proceed to delete
              await ${model.charAt(0).toUpperCase() + model.slice(1)}.deleteOne({ _id: id }).exec()

              // Return delete message
              return '${model.toLowerCase()} deleted successfully'             
            } catch (e) {
              throw new ApolloError(e.message)
            }
          },
          ${Object.entries(data.mutation).map(u => `
            ${u[0]}: async (root, {${parameters(u[1])}}, { token }, info) => {
              try {
                ${u[1].split('$')[1]
      ? u[1].split('$')[1].includes('auth')
        ? `// verify if token is valid
                  let payload = await jwtAuth(token)`
        : ''
      : ''}
                /*
                  WRITE YOU BUSINESS LOGIC HERE
                */
              } catch (e) {
                throw new ApolloError(e.message)
              }
          }`)}
        }
      }
  `)
}
