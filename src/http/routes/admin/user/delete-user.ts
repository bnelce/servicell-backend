import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";

export async function deleteUser(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/admin/users/:id",
    {
      schema: {
        tags: ["Admin - Users"],
        summary: "Delete a user",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid user ID"),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.user.delete({
        where: { id: Number(id) },
      });

      return reply.status(204).send();
    }
  );
}
