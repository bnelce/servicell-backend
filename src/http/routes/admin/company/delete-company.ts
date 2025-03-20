import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";

export async function deleteCompany(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/admin/companies/:id",
    {
      schema: {
        tags: ["Admin - Companies"],
        summary: "Delete a company",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid company ID"),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.company.delete({
        where: { id: Number(id) },
      });

      return reply.status(204).send();
    }
  );
}
