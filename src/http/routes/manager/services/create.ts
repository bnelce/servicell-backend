import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerCreateService(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/manager/services",
    {
      schema: {
        tags: ["Manager - Services"],
        summary: "Create a new service",
        body: z.object({
          description: z.string(),
          price: z.number(),
        }),
        response: {
          201: z.object({
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
      const { description, price } = request.body;
      const service = await prisma.service.create({
        data: { description, price, companyId },
      });
      const transformedService = {
        id: service.id,
        description: service.description,
        price: service.price.toNumber(),
      };
      return reply.status(201).send(transformedService);
    }
  );
}
