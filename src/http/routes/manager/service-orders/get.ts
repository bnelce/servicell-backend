import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerGetServiceOrder(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/manager/service-orders/:id",
    {
      schema: {
        tags: ["Manager - Service Orders"],
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
            serviceOrderItems: z
              .array(
                z.object({
                  id: z.number(),
                  itemType: z.enum(["service", "product"]),
                  itemId: z.number(),
                  quantity: z.number(),
                  unitPrice: z.number(),
                  total: z.number(),
                })
              )
              .nullable(),
          }),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const { id } = request.params as { id: string };

      const order = await prisma.serviceOrder.findFirst({
        where: { id: Number(id), companyId },
        include: { serviceOrderItems: true },
      });
      if (!order) {
        throw new BadRequestError("Service order not found");
      }

      const transformedOrder = {
        ...order,
        openedAt: order.openedAt.toISOString(),
        closedAt: order.closedAt ? order.closedAt.toISOString() : null,
        estimatedBudgetDate: order.estimatedBudgetDate ? order.estimatedBudgetDate.toISOString() : null,
        estimatedPickupDate: order.estimatedPickupDate ? order.estimatedPickupDate.toISOString() : null,
        serviceOrderItems: order.serviceOrderItems?.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toNumber(),
          total: item.total.toNumber(),
        })) || [],
      };

      return reply.send(transformedOrder);
    }
  );
}
