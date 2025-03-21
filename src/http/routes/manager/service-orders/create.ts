import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function managerCreateServiceOrder(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/manager/service-orders",
    {
      schema: {
        tags: ["Manager - Service Orders"],
        summary: "Create a new service order with nested items",
        body: z.object({
          customerId: z.number(),
          deviceBrand: z.string(),
          deviceModel: z.string(),
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
          serviceOrderItems: z
            .array(
              z.object({
                itemType: z.enum(["service", "product"]),
                itemId: z.number(),
                quantity: z.number(),
                unitPrice: z.number(),
              })
            )
            .optional(),
        }),
        response: {
          201: z.object({
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
      const {
        customerId,
        deviceBrand,
        deviceModel,
        deviceColor,
        deviceImei,
        devicePassword,
        deviceCondition,
        deviceAccessories,
        hasWarranty,
        hasInvoice,
        estimatedBudgetDate,
        estimatedPickupDate,
        notes,
        responsibilityTerm,
        clientSignature,
        technicianSignature,
        serviceOrderItems,
      } = request.body;

      const customer = await prisma.customer.findFirst({
        where: { id: customerId, companyId },
      });
      if (!customer) {
        throw new BadRequestError("Customer not found for this company");
      }

      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.serviceOrder.create({
          data: {
            companyId,
            customerId,
            responsibleUserId: Number(managerId),
            deviceBrand,
            deviceModel,
            deviceColor,
            deviceImei,
            devicePassword,
            deviceCondition,
            deviceAccessories,
            hasWarranty: hasWarranty ?? false,
            hasInvoice: hasInvoice ?? false,
            estimatedBudgetDate: estimatedBudgetDate ? new Date(estimatedBudgetDate) : null,
            estimatedPickupDate: estimatedPickupDate ? new Date(estimatedPickupDate) : null,
            notes,
            responsibilityTerm,
            clientSignature,
            technicianSignature,
            status: "open",
          },
        });

        if (serviceOrderItems && serviceOrderItems.length > 0) {
          await tx.serviceOrderItem.createMany({
            data: serviceOrderItems.map((item) => ({
              serviceOrderId: order.id,
              itemType: item.itemType,
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity,
            })),
          });
        }

        const createdOrder = await tx.serviceOrder.findUnique({
          where: { id: order.id },
          include: { serviceOrderItems: true },
        });
        return createdOrder;
      });

      // Verifica se o resultado da transação é nulo
      if (!result) {
        throw new BadRequestError("Failed to create service order");
      }

      // Transforma as datas e converte valores decimais para number
      const transformedOrder = {
        ...result,
        openedAt: result.openedAt.toISOString(),
        closedAt: result.closedAt ? result.closedAt.toISOString() : null,
        estimatedBudgetDate: result.estimatedBudgetDate ? result.estimatedBudgetDate.toISOString() : null,
        estimatedPickupDate: result.estimatedPickupDate ? result.estimatedPickupDate.toISOString() : null,
        serviceOrderItems: result.serviceOrderItems?.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toNumber(),
          total: item.total.toNumber(),
        })) || [],
      };

      return reply.status(201).send(transformedOrder);
    }
  );
}