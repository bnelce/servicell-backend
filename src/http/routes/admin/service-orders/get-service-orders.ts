import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";

export async function getServiceOrders(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/admin/service-orders",
    {
      schema: {
        tags: ["Admin - Service Orders"],
        summary: "List all service orders",
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
      const serviceOrders = await prisma.serviceOrder.findMany();
      const transformedOrders = serviceOrders.map((order) => ({
        ...order,
        openedAt: order.openedAt.toISOString(),
        closedAt: order.closedAt ? order.closedAt.toISOString() : null,
        estimatedBudgetDate: order.estimatedBudgetDate
          ? order.estimatedBudgetDate.toISOString()
          : null,
        estimatedPickupDate: order.estimatedPickupDate
          ? order.estimatedPickupDate.toISOString()
          : null,
      }));
      return reply.send(transformedOrders);
    }
  );
}
