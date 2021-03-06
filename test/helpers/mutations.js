import {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
} from 'graphql';

import errorLogger from './errorLogger';

const BlogInput = new GraphQLInputObjectType({
  name: 'BlogInput',
  fields: () => ({
    title: { type: GraphQLString },
    author: { type: GraphQLID },
  }),
});

const UserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: () => ({
    name: { type: GraphQLString },
    blogs: { type: new GraphQLNonNull(new GraphQLList(GraphQLID)) },
  }),
});

export default (type) => {
  let inputType;

  if (type.name === 'user') {
    inputType = UserInput;
  } else if (type.name === 'blog') {
    inputType = BlogInput;
  } else {
    throw new Error('Invalid type.');
  }

  return {
    [`create${type.name}`]: {
      args: { input: { type: new GraphQLNonNull(inputType) } },
      actions: {
        finalize: (args, ctx) => ctx.data,
        error: (err) => errorLogger().add(err),
        resolve: (args, ctx) => type.model.create(args).then(data => (ctx.data = data)),
      },
    },
  };
};
