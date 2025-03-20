import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function managerGetService(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/manager/services/:id",
    {
      schema: {
        tags: ["Manager - Services"],
        summary: "Get service details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid service ID"),
        }),
        response: {
          200: z.object({
            id: z.number(),
            description: z.string(),
            price: z.number(),
          }),
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
      const transformedService = {
        id: service.id,
        description: service.description,
        price: service.price.toNumber(),
      };
      return reply.send(transformedService);
    }
  );
}
