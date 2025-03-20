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
        summary: "Create a new service order",
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
          estimatedBudgetDate: z.string().optional(), // ISO string
          estimatedPickupDate: z.string().optional(),
          notes: z.string().optional(),
          responsibilityTerm: z.string().optional(),
          clientSignature: z.string().optional(),
          technicianSignature: z.string().optional(),
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
      } = request.body;
      
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, companyId },
      });
      if (!customer) {
        throw new BadRequestError("Customer not found for this company");
      }
      
      const serviceOrder = await prisma.serviceOrder.create({
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
      
      const transformedOrder = {
        ...serviceOrder,
        openedAt: serviceOrder.openedAt.toISOString(),
        closedAt: serviceOrder.closedAt ? serviceOrder.closedAt.toISOString() : null,
        estimatedBudgetDate: serviceOrder.estimatedBudgetDate ? serviceOrder.estimatedBudgetDate.toISOString() : null,
        estimatedPickupDate: serviceOrder.estimatedPickupDate ? serviceOrder.estimatedPickupDate.toISOString() : null,
      };
      
      return reply.status(201).send(transformedOrder);
    }
  );
}
