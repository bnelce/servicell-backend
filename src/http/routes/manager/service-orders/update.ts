import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerUpdateServiceOrder(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/manager/service-orders/:id",
    {
      schema: {
        tags: ["Manager - Service Orders"],
        summary: "Update service order details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid service order ID"),
        }),
        body: z.object({
          deviceBrand: z.string().optional(),
          deviceModel: z.string().optional(),
          deviceColor: z.string().optional(),
          deviceImei: z.string().optional(),
          devicePassword: z.string().optional(),
          deviceCondition: z.string().optional(),
          deviceAccessories: z.string().optional(),
          hasWarranty: z.boolean().optional(),
          hasInvoice: z.boolean().optional(),
          estimatedBudgetDate: z.string().optional(),
          estimatedPickupDate: z.string().optional(),
          notes: z.string().optional(),
          responsibilityTerm: z.string().optional(),
          clientSignature: z.string().optional(),
          technicianSignature: z.string().optional(),
          status: z.string().optional(),
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
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const { id } = request.params as { id: string };
      const data = request.body as any;
      
      // Verifica se a ordem pertence à empresa do gerente
      const order = await prisma.serviceOrder.findFirst({
        where: { id: Number(id), companyId },
      });
      if (!order) {
        throw new BadRequestError("Service order not found");
      }
      
      const updatedOrder = await prisma.serviceOrder.update({
        where: { id: Number(id) },
        data,
      });
      
      const transformedOrder = {
        ...updatedOrder,
        openedAt: updatedOrder.openedAt.toISOString(),
        closedAt: updatedOrder.closedAt ? updatedOrder.closedAt.toISOString() : null,
        estimatedBudgetDate: updatedOrder.estimatedBudgetDate ? updatedOrder.estimatedBudgetDate.toISOString() : null,
        estimatedPickupDate: updatedOrder.estimatedPickupDate ? updatedOrder.estimatedPickupDate.toISOString() : null,
      };
      
      return reply.send(transformedOrder);
    }
  );
}
