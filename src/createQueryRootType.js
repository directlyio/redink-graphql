import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';

import buildConnectionType from './buildConnectionType';
import handleResolver from './handleResolver';
import optionsInputType from './optionsInputType';
import titleizeType from './titleizeType';

export default (schema, resolvers, middleware, types) => new GraphQLObjectType({
  name: 'Query',
  fields: () => schema.types.reduce((prev, type) => {
    const { meta, name } = type;

    if (!meta) {
      throw new Error(
        'Every schema must have a valid meta key. The ' +
        `${name} schema did not have a meta key.`
      );
    }

    if (!meta.inflection) {
      throw new Error(
        'Every schema must have a meta.inflection key. ' +
        'Inflection keys are required to properly build GraphQL queries. Please add a ' +
        `meta.inflection key to the ${name} schema.`
      );
    }

    const { inflection } = meta;
    const connectionType = buildConnectionType(name, types[name]);
    const fetchQueryName = `fetch${titleizeType(name)}`;
    const findQueryName = `find${titleizeType(inflection)}`;

    return {
      ...prev,

      // retrieve a single node
      [fetchQueryName]: {
        type: types[name],
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve(root, args, ctx) {
          if (!resolvers.hasOwnProperty(fetchQueryName)) {
            throw new Error(
              `The ${fetchQueryName} resolver was never registered.`
            );
          }

          return handleResolver(args, ctx, resolvers[fetchQueryName], middleware);
        },
      },

      // create a connection
      [findQueryName]: {
        type: connectionType,
        args: {
          options: { type: optionsInputType },
        },
        resolve(root, args, ctx) {
          if (!resolvers.hasOwnProperty(findQueryName)) {
            throw new Error(
              `The ${findQueryName} resolver was never registered.`
            );
          }

          return handleResolver(args, ctx, resolvers[findQueryName], middleware);
        },
      },
    };
  }, {}),
});
