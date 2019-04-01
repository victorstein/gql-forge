export const gitignore = () => {
  return (`
    node_modules
    .env
  `)
}

export const env = ({
  DB_USER = 'mdbUser',
  DB_PASS = 'mdbpass',
  DB_URI = 'dburi',
  jwt,
  jwtExp
}) => {
  jwtExp = jwtExp.length ? jwtExp : '20m'
  return (`
    PORT = 5000
    NODE_ENV = development
    DB_USER = ${DB_USER}
    DB_PASS = ${DB_PASS}
    DB_URI = ${DB_URI}
    JWT_SECRET = ${jwt}
    JWT_EXPIRATION = ${jwtExp}
  `)
}

export const readme = () => {
  return (`
    # My project

    API using graphQL, apollo server 2.0, Express, Webpack, Babel, dotenv, nodemon, jsonwebtoken, bcrypt and mongoose.

    ### Installation

    Just clone the repo

    add a .env file to the root containing the following schema:

    \`\`\`
    PORT = INT //Port to run the app
    NODE_ENV = STRING //"development" or "production"
    DB_USER = STRING //mongodb user
    DB_PASS = STRING //mongodb password
    DB_URI = STRING //mongodb URI comes after the @ and before the port
    DB_PORT = INT //mongodb port
    DB_NAME = STRING //mongodb database name
    JWT_SECRET = STRING //JWT Secret used to generate tokens
    JWT_EXPIRATION = STRING // Expiration according to jsonwebtoken docs
    \`\`\`
    [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken)

    ### Run the server

    After cloning cd into the directory and run :
    \`\`\`npm install\`\`\`

    when done run:
    \`\`\`npm run dev\`\`\`

    If you want to just build you may also:
    \`\`\`npm run build\`\`\`
    for just webpack compilation

    ### Author
    ...
  `)
}

export const webpack = () => {
  return (`
    const path = require('path')
    const nodeExternals = require('webpack-node-externals')
    require('dotenv').config()
    
    const { NODE_ENV } = process.env
    
    module.exports = {
      entry: {
        server: './src/server.js'
      },
      output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: 'server.bundle.js'
      },
      module: {
        rules: [{
          test: /\.js$/,
          exclude: path.resolve(__dirname, 'node_modules/'),
          loader: 'babel-loader',
          query: {
            presets: ['@babel/preset-env']
          }
        }]
      },
      mode: NODE_ENV,
      target: 'node',
      watch: true,
      externals: [nodeExternals()]
    }
  `)
}

export const server = (models) => {
  return (`
    import '@babel/polyfill'
    import { ApolloServer, ApolloError } from 'apollo-server-express'
    import express from 'express'
    import { config } from 'dotenv'
    import resolvers from './resolvers'
    import typeDefs from './typeDefs'
    import mongoose from 'mongoose'
    import models from './models'
    import { createServer } from 'http'

    (async () => {
      try {
        config()
        const { PORT, NODE_ENV, DB_URI, DB_PASS, DB_USER } = process.env
        const {
          ${models.toString()}
        } = models
        const app = express()

        app.disable('x-powered-by')

        await mongoose.connect(
          \`mongodb+srv://\${DB_USER}:\${DB_PASS}@\${DB_URI}\`,
          {
            useNewUrlParser: true
          }
        )

        const server = new ApolloServer({
          typeDefs,
          resolvers,
          playground: NODE_ENV !== 'production',
          context: ({ req, connection }) => {
            if (connection) {
              return connection.context
            } else if (req) {
              // Check if authorization header was sent
              const token = req.headers.authorization || null

              return {
                token,
                ${models.toString()}
              }
            }
          },
          formatError: (error) => {
            console.log(error)
            if (error.originalError instanceof ApolloError) {
              return error
            }

            throw new ApolloError(\`\${error}\`)
          },
          debug: NODE_ENV !== 'production'
        })

        server.applyMiddleware({ app })

        const httpServer = createServer(app)
        server.installSubscriptionHandlers(httpServer)

        httpServer.listen({ port: PORT }, () => {
          console.log(\`🚀 Server ready at http://localhost:\${PORT}\${server.graphqlPath}\`)
          console.log(\`🚀 Subscriptions ready at ws://localhost:\${PORT}\${server.subscriptionsPath}\`)
        })
      } catch (e) {
        console.log(e)
        throw new Error(\`Internal Server error: \${e.message}\`)
      }
    })()
  `)
}
