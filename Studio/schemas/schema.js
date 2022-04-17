// First, we must import the schema creator
import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import { postSchema } from './postSchema'

export default createSchema({
  name: 'default',
  types: schemaTypes.concat([
    postSchema
  ]),
})
