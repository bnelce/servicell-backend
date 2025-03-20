import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerListServiceOrders(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/manager/service-orders",
    {
      schema: {
        tags: ["Manager - Service Orders"],
        summary: "List all service orders for the manager's company",
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              companyId: z.number(),
              customerId: z.number(),
              responsibleUserId: z.number(),
              deviceBrand: z.string(),
              deviceModel: z.string(),
              deviceColor: z.string().nullable(),
              deviceImei: z.string().nullable(),
              devicePassword: z.string().nullable(),
              deviceCondition: z.string().nullable(),
              deviceAccessories: z.string().nullable(),
              hasWarranty: z.boolean(),
              hasInvoice: z.boolean(),
              openedAt: z.string(),
              closedAt: z.string().nullable(),
              estimatedBudgetDate: z.string().nullable(),
              estimatedPickupDate: z.string().nullable(),
              status: z.string(),
              notes: z.string().nullable(),
              responsibilityTerm: z.string().nullable(),
              clientSignature: z.string().nullable(),
              technicianSignature: z.string().nullable(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const orders = await prisma.serviceOrder.findMany({
        where: { companyId },
      });
      const transformedOrders = orders.map(order => ({
        ...order,
        openedAt: order.openedAt.toISOString(),
        closedAt: order.closedAt ? order.closedAt.toISOString() : null,
        estimatedBudgetDate: order.estimatedBudgetDate ? order.estimatedBudgetDate.toISOString() : null,
        estimatedPickupDate: order.estimatedPickupDate ? order.estimatedPickupDate.toISOString() : null,
      }));
      return reply.send(transformedOrders);
    }
  );
}
