import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerListServices(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/manager/services",
    {
      schema: {
        tags: ["Manager - Services"],
        summary: "List all services for the manager's company",
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              description: z.string(),
              price: z.number(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const services = await prisma.service.findMany({
        where: { companyId },
      });
      const transformedServices = services.map(service => ({
        id: service.id,
        description: service.description,
        price: service.price.toNumber(),
      }));
      return reply.send(transformedServices);
    }
  );
}
