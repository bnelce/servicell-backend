import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerDeleteServiceOrder(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/manager/service-orders/:id",
    {
      schema: {
        tags: ["Manager - Service Orders"],
        summary: "Delete a service order",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid service order ID"),
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

      const order = await prisma.serviceOrder.findFirst({
        where: { id: Number(id), companyId },
      });
      if (!order) {
        throw new BadRequestError("Service order not found");
      }

      await prisma.$transaction([
        prisma.serviceOrderItem.deleteMany({ where: { serviceOrderId: Number(id) } }),
        prisma.serviceOrder.delete({ where: { id: Number(id) } }),
      ]);

      return reply.status(204).send();
    }
  );
}
