import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerDeleteService(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/manager/services/:id",
    {
      schema: {
        tags: ["Manager - Services"],
        summary: "Delete a service",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid service ID"),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const { id } = request.params as { id: string };
      const service = await prisma.service.findFirst({
        where: { id: Number(id), companyId },
      });
      if (!service) {
        throw new BadRequestError("Service not found");
      }
      await prisma.service.delete({
        where: { id: Number(id) },
      });
      return reply.status(204).send();
    }
  );
}
