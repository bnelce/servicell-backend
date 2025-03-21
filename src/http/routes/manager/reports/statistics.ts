import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerGetStatistics(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/manager/statistics",
    {
      schema: {
        tags: ["Manager - Statistics"],
        summary: "Get main statistics for the company",
        response: {
          200: z.object({
            totalOrders: z.number(),
            ordersByStatus: z.object({
              open: z.number(),
              in_progress: z.number(),
              completed: z.number(),
              cancelled: z.number(),
            }),
            totalCustomers: z.number(),
            totalRevenue: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);

      // Total de ordens de serviço
      const totalOrders = await prisma.serviceOrder.count({
        where: { companyId },
      });

      // Agrupamento das ordens por status
      const ordersByStatusRaw = await prisma.serviceOrder.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { companyId },
      });

      // Inicializa os contadores
      const ordersByStatus = {
        open: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      };

      ordersByStatusRaw.forEach((group) => {
        // group.status é uma string; atribuímos o _count.id ao status correspondente
        ordersByStatus[group.status] = group._count.id;
      });

      // Total de clientes
      const totalCustomers = await prisma.customer.count({
        where: { companyId },
      });

      // Total de receita dos pedidos concluídos (soma dos totais dos itens das OS com status "completed")
      const revenueResult = await prisma.serviceOrderItem.aggregate({
        _sum: { total: true },
        where: {
          serviceOrder: {
            companyId,
            status: "completed",
          },
        },
      });
      // Converte o total (que pode ser um Decimal) para number ou 0 se for null
      const totalRevenue = revenueResult._sum.total ? revenueResult._sum.total.toNumber() : 0;

      return reply.send({ totalOrders, ordersByStatus, totalCustomers, totalRevenue });
    }
  );
}
