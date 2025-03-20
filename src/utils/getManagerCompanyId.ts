import { BadRequestError } from "../http/routes/_errors/bad-request-error";
import { prisma } from "../lib/prisma";


export async function getManagerCompanyId(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { companyId: true },
  });
  if (!user || !user.companyId) {
    throw new BadRequestError("Manager's company not found");
  }
  return user.companyId;
}
