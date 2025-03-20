import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerUpdateCustomer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/manager/customers/:id",
    {
      schema: {
        tags: ["Manager - Customers"],
        summary: "Update customer details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid customer ID"),
        }),
        body: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
        }),
        response: {
          200: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string().email().nullable(),
            phone: z.string().nullable(),
            address: z.string().nullable(),
            registeredAt: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const customer = await prisma.customer.findFirst({
        where: { id: Number(id), companyId },
      });
      if (!customer) {
        throw new BadRequestError("Customer not found");
      }

      const updatedCustomer = await prisma.customer.update({
        where: { id: Number(id) },
        data,
      });
      return reply.send({
        ...updatedCustomer,
        registeredAt: updatedCustomer.registeredAt.toISOString(),
      });
    }
  );
}
