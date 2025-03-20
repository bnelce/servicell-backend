import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function getUser(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/admin/users/:id",
    {
      schema: {
        tags: ["Admin - Users"],
        summary: "Get user details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid user ID"),
        }),
        response: {
          200: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string().email(),
            role: z.string(),
            companyId: z.number().nullable(),
            createdAt: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
      });
      if (!user) {
        throw new BadRequestError("User not found");
      }

      const transformedUser = {
        ...user,
        createdAt: user.createdAt.toISOString(),
      };

      return reply.send(transformedUser);
    }
  );
}
