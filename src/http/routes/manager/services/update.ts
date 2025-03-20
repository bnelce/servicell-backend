import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function managerUpdateService(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/manager/services/:id",
    {
      schema: {
        tags: ["Manager - Services"],
        summary: "Update service details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid service ID"),
        }),
        body: z.object({
          description: z.string().optional(),
          price: z.number().optional(),
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
      const data = request.body as { description?: string; price?: number };
      const service = await prisma.service.findFirst({
        where: { id: Number(id), companyId },
      });
      if (!service) {
        throw new BadRequestError("Service not found");
      }
      const updatedService = await prisma.service.update({
        where: { id: Number(id) },
        data,
      });
      const transformedService = {
        id: updatedService.id,
        description: updatedService.description,
        price: updatedService.price.toNumber(), 
      };
      return reply.send(transformedService);
    }
  );
}
