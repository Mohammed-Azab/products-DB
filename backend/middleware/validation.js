const Joi = require('joi')

const validateTableCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().alphanum().min(1).max(64).required(),
    displayName: Joi.string().min(1).max(255).optional(),
    columns: Joi.array().items(
      Joi.object({
        name: Joi.string().alphanum().min(1).max(64).required(),
        type: Joi.string().valid(
          'varchar', 'text', 'int', 'integer', 'bigint', 'decimal', 'float', 'double',
          'boolean', 'date', 'datetime', 'timestamp', 'time', 'year', 'char'
        ).required(),
        length: Joi.number().integer().min(1).max(65535).optional(),
        nullable: Joi.boolean().default(true),
        primaryKey: Joi.boolean().default(false),
        autoIncrement: Joi.boolean().default(false),
        default: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).optional()
      })
    ).min(1).required()
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  next()
}

const validateTableUpdate = (req, res, next) => {
  const schema = Joi.object({
    action: Joi.string().valid('add_column', 'delete_column', 'modify_column').required(),
    column: Joi.alternatives().conditional('action', {
      is: 'add_column',
      then: Joi.object({
        name: Joi.string().alphanum().min(1).max(64).required(),
        type: Joi.string().valid(
          'varchar', 'text', 'int', 'integer', 'bigint', 'decimal', 'float', 'double',
          'boolean', 'date', 'datetime', 'timestamp', 'time', 'year', 'char'
        ).required(),
        length: Joi.number().integer().min(1).max(65535).optional(),
        nullable: Joi.boolean().default(true),
        default: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).optional()
      }).required(),
      otherwise: Joi.string().min(1).required()
    })
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  next()
}

const validateDataInput = (req, res, next) => {
  // Basic validation - ensure req.body is an object
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid data format' })
  }

  next()
}

module.exports = {
  validateTableCreation,
  validateTableUpdate,
  validateDataInput
}
