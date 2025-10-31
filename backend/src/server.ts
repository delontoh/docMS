import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { PrismaClient } from '@prisma/client';
import { gql } from 'graphql-tag';

const prisma = new PrismaClient();

const typeDefs = gql`
  scalar DateTime

  type User {
    id: ID!
    email: String!
    name: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    health: String!
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(email: String!, name: String): User!
    updateUser(id: ID!, email: String, name: String): User!
    deleteUser(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    health: () => 'ok',
    users: async () => prisma.user.findMany({ orderBy: { id: 'asc' } }),
    user: async (_: unknown, args: { id: string }) =>
      prisma.user.findUnique({ where: { id: Number(args.id) } }),
  },
  Mutation: {
    createUser: async (
      _: unknown,
      args: { email: string; name?: string | null }
    ) => prisma.user.create({ data: { email: args.email, name: args.name ?? null } }),
    updateUser: async (
      _: unknown,
      args: { id: string; email?: string; name?: string | null }
    ) =>
      prisma.user.update({
        where: { id: Number(args.id) },
        data: { email: args.email ?? undefined, name: args.name ?? undefined },
      }),
    deleteUser: async (_: unknown, args: { id: string }) => {
      await prisma.user.delete({ where: { id: Number(args.id) } });
      return true;
    },
  },
};

async function start() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use('/graphql', expressMiddleware(server));

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  app.listen(port, () => {
    console.log(`GraphQL server ready at http://localhost:${port}/graphql`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

