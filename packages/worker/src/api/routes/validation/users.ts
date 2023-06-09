import { auth } from "@budibase/backend-core"
import Joi from "joi"

let schema: any = {
  email: Joi.string().allow(null, ""),
  password: Joi.string().allow(null, ""),
  forceResetPassword: Joi.boolean().optional(),
  firstName: Joi.string().allow(null, ""),
  lastName: Joi.string().allow(null, ""),
  builder: Joi.object({
    global: Joi.boolean().optional(),
    apps: Joi.array().optional(),
  })
    .unknown(true)
    .optional(),
  // maps appId -> roleId for the user
  roles: Joi.object().pattern(/.*/, Joi.string()).required().unknown(true),
}

export const buildSelfSaveValidation = () => {
  schema = {
    password: Joi.string().optional(),
    forceResetPassword: Joi.boolean().optional(),
    firstName: Joi.string().allow("").optional(),
    lastName: Joi.string().allow("").optional(),
    onboardedAt: Joi.string().optional(),
  }
  return auth.joiValidator.body(Joi.object(schema).required().unknown(false))
}

export const buildUserSaveValidation = () => {
  schema = {
    ...schema,
    _id: Joi.string(),
    _rev: Joi.string(),
  }
  return auth.joiValidator.body(Joi.object(schema).required().unknown(true))
}

export const buildUserBulkUserValidation = (isSelf = false) => {
  if (!isSelf) {
    schema = {
      ...schema,
      _id: Joi.string(),
      _rev: Joi.string(),
    }
  }
  let bulkSchema = {
    create: Joi.object({
      groups: Joi.array().optional(),
      users: Joi.array().items(Joi.object(schema).required().unknown(true)),
    }),
    delete: Joi.object({
      userIds: Joi.array().items(Joi.string()),
    }),
  }

  return auth.joiValidator.body(Joi.object(bulkSchema).required().unknown(true))
}
