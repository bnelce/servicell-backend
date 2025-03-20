import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function getServiceOrder(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/admin/service-orders/:id",
    {
      schema: {
        tags: ["Admin - Service Orders"],
        summary: "Get service order details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid service order ID"),
        }),
        response: {
          200: z.object({
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
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const order = await prisma.serviceOrder.findUnique({
        where: { id: Number(id) },
      });
      if (!order) {
        throw new BadRequestError("Service order not found");
      }

      const transformedOrder = {
        ...order,
        openedAt: order.openedAt.toISOString(),
        closedAt: order.closedAt ? order.closedAt.toISOString() : null,
        estimatedBudgetDate: order.estimatedBudgetDate
          ? order.estimatedBudgetDate.toISOString()
          : null,
        estimatedPickupDate: order.estimatedPickupDate
          ? order.estimatedPickupDate.toISOString()
          : null,
      };

      return reply.send(transformedOrder);
    }
  );
}
