import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerCreateCustomer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/manager/customers",
    {
      schema: {
        tags: ["Manager - Customers"],
        summary: "Create a new customer",
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          address: z.string().optional(),
        }),
        response: {
          201: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string().email().nullable(), // Permite que o email seja null
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

      const { name, email, phone, address } = request.body;
      const customer = await prisma.customer.create({
        data: { name, email, phone, address, companyId },
      });
      return reply.status(201).send({
        ...customer,
        registeredAt: customer.registeredAt.toISOString(),
      });
    }
  );
}
