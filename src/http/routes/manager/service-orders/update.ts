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
        summary: "Update service order details with nested items",
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
          serviceOrderItems: z.array(
            z.object({
              id: z.number().optional(), // Se fornecido, atualiza; se não, cria novo
              itemType: z.enum(["service", "product"]),
              itemId: z.number(),
              quantity: z.number(),
              unitPrice: z.number(),
            })
          ).optional(),
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
            serviceOrderItems: z.array(
              z.object({
                id: z.number(),
                itemType: z.enum(["service", "product"]),
                itemId: z.number(),
                quantity: z.number(),
                unitPrice: z.number(),
                total: z.number(),
              })
            ).nullable(),
          }),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const { id } = request.params as { id: string };
      const { serviceOrderItems, ...orderData } = request.body as any;

      // Verifica se a OS pertence à empresa do gerente
      const existingOrder = await prisma.serviceOrder.findFirst({
        where: { id: Number(id), companyId },
      });
      if (!existingOrder) {
        throw new BadRequestError("Service order not found");
      }

      // Atualiza a OS e seus itens em uma transação
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.serviceOrder.update({
          where: { id: Number(id) },
          data: orderData,
        });

        if (serviceOrderItems) {
          for (const item of serviceOrderItems) {
            if (item.id) {
              // Atualiza item existente
              await tx.serviceOrderItem.update({
                where: { id: item.id },
                data: {
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  total: item.unitPrice * item.quantity,
                },
              });
            } else {
              // Cria novo item
              await tx.serviceOrderItem.create({
                data: {
                  serviceOrderId: order.id,
                  itemType: item.itemType,
                  itemId: item.itemId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  total: item.unitPrice * item.quantity,
                },
              });
            }
          }
          // Opcional: deletar itens que não estejam no payload
        }

        const updated = await tx.serviceOrder.findUnique({
          where: { id: order.id },
          include: { serviceOrderItems: true },
        });
        return updated;
      });

      if (!updatedOrder) {
        throw new BadRequestError("Failed to update service order");
      }

      const transformedOrder = {
        ...updatedOrder,
        openedAt: updatedOrder.openedAt.toISOString(),
        closedAt: updatedOrder.closedAt ? updatedOrder.closedAt.toISOString() : null,
        estimatedBudgetDate: updatedOrder.estimatedBudgetDate ? updatedOrder.estimatedBudgetDate.toISOString() : null,
        estimatedPickupDate: updatedOrder.estimatedPickupDate ? updatedOrder.estimatedPickupDate.toISOString() : null,
        serviceOrderItems: updatedOrder.serviceOrderItems?.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toNumber(),
          total: item.total.toNumber(),
        })) || [],
      };

      return reply.send(transformedOrder);
    }
  );
}
