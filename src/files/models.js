export const index = (models) => `
  ${models.map(u => `import ${u} from './${u}'`).toString().replace(/,/g, '\n')}

  export default {
    ${models.toString()}
  }
`
export const model = (model, data) => {
  let scalarTypes = ['String', 'Int', 'Boolean', 'ID']

  const getType = (u) => {
    let type = u.replace(/!/g, '')
    if (scalarTypes.some(u => u.includes(type))) {
      return type === 'Int' ? 'Number' : type
    }
    return '[Schema.Types.ObjectId]'
  }

  const ref = (type, model) => {
    type = type.replace(/!/g, '')
    return scalarTypes.some(u => u.includes(type)) ? '' : `, ref: '${model}'`
  }

  return (`
    import mongoose, {
      Schema
    } from 'mongoose'
    
    const ${model}Schema = new Schema({
      ${
    Object.entries(data.type).map(u => `
      ${u[0]}: {
        type: ${getType(u[1])},
        required: ${u[1].includes('!')}
        ${ref(u[1], u[0])}
      }
    `)
    }
    }, {
      timestamps: true
    })
    
    export default mongoose.model('${model}', ${model}Schema)
  `)
}