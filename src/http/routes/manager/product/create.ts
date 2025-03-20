import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerCreateProduct(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/manager/products",
    {
      schema: {
        tags: ["Manager - Products"],
        summary: "Create a new product",
        body: z.object({
          description: z.string(),
          price: z.number(),
          stock: z.number().optional(),
        }),
        response: {
          201: z.object({
            id: z.number(),
            description: z.string(),
            price: z.number(),
            stock: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const { description, price, stock } = request.body;
      const product = await prisma.product.create({
        data: { description, price, stock: stock ?? 0, companyId },
      });
      
      const transformedProduct = {
        ...product,
        price: product.price.toNumber(),
      };
      
      return reply.status(201).send(transformedProduct);
    }
  );
}
