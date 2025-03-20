import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerListProducts(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/manager/products",
    {
      schema: {
        tags: ["Manager - Products"],
        summary: "List all products for the manager's company",
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              description: z.string(),
              price: z.number(),
              stock: z.number(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const products = await prisma.product.findMany({
        where: { companyId },
      });
      const transformedProducts = products.map((product) => ({
        id: product.id,
        description: product.description,
        price: product.price.toNumber(),
        stock: product.stock,
      }));
      return reply.send(transformedProducts);
    }
  );
}
