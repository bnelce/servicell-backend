import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";

export async function getUsers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/admin/users",
    {
      schema: {
        tags: ["Admin - Users"],
        summary: "List all users",
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              email: z.string().email(),
              role: z.string(),
              companyId: z.number().nullable(),
              createdAt: z.string(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const users = await prisma.user.findMany();
      const transformedUsers = users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      }));
      return reply.send(transformedUsers);
    }
  );
}
