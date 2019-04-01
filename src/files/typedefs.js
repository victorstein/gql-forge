import Pluralize from 'pluralize'

export const typeDefIndex = (models) => `
  ${models.map(u => `
  import ${u.toLowerCase()} from './${u.toLowerCase()}'`).toString().replace(/,/g, '\n')}
  import root from './root'

  export default [
    root,
    ${models.toString().toLowerCase().replace(/,/g, ',\n')}
  ]
`

export const typeDefRoot = () => `
  import { gql } from 'apollo-server-express'

  export default gql\`
    type Query {
      _: String
      me: User
    }

    type token {
      token: String
      hs: String
    }

    type Mutation {
      _: String

      signUp(
        email: String!
        firstName: String!
        lastName: String!
        password: String!
      ): User

     login(email: String!, password: String!): token

      tokenRevision(
        token: String
        hs: String
      ): token

      requestPwReset(
          email: String!
      ):String

      resetPassword(
        hash: String!
        newPassword: String!
      ): String
    }
    type Subscription {
      _: String
    }
  \`
`

export const typeDef = (model, data) => {
  const cleaner = (method, resolve) => {
    let checkIfArguments = resolve.includes('(')
    method = `${method}${checkIfArguments ? `(${resolve.match(/\(([^)]+)\)/)[1]})` : ''}`
    resolve = `${checkIfArguments ? resolve.split(')')[1].split('$')[0] : resolve.split('$')[0]}`
    return `${method}: ${resolve.split(':')[1]}`
  }

  const retreiveAllParams = (data) => {
    let scalarTypes = ['String', 'Int', 'Boolean', 'ID']

    return Object.entries(data).reduce((x, u) => {
      if (scalarTypes.some(scalar => u.includes(scalar))) {
        x.push(`${u[0]}: ${u[1]}`)
        return x
      }
      return x
    }, [])
  }

  return (`
    import { gql } from 'apollo-server-express'

    export default gql\`

      type ${model} {
        id: ID
        ${Object.entries(data.type).map(u => `${u[0]}: ${u[1]}`).toString().replace(/,/g, '\n\t\t')}
      }

      extend type Query {
        ${model.toLowerCase()}( id: String! ): ${model.charAt(0).toUpperCase() + model.slice(1)}
        ${Pluralize(model.toLowerCase())}: [${model.charAt(0).toUpperCase() + model.slice(1)}]
        ${Object.entries(data.query).map(u => cleaner(u[0], u[1])).toString().replace(/,/g, '\n\t\t')}
      }

      extend type Mutation {
        create${model.charAt(0).toUpperCase() + model.slice(1)}(${retreiveAllParams(data.type)}): ${model.charAt(0).toUpperCase() + model.slice(1)}
        update${model.charAt(0).toUpperCase() + model.slice(1)}(${retreiveAllParams(data.type)}): ${model.charAt(0).toUpperCase() + model.slice(1)}
        delete${model.charAt(0).toUpperCase() + model.slice(1)}(id: String!): ${model.charAt(0).toUpperCase() + model.slice(1)}
        ${Object.entries(data.mutation).map(u => cleaner(u[0], u[1])).toString().replace(/,/g, '\n\t\t')}
      }
    \`
  `)
}
