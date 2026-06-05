import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const pass = (p: string) => bcrypt.hash(p, 12);

  // ---------------------------------------------------------------- Usuários
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rdo.mil.br' },
    update: {},
    create: {
      name: 'Administrador do Sistema',
      email: 'admin@rdo.mil.br',
      passwordHash: await pass('admin123'),
      role: 'ADMINISTRADOR',
      rank: 'Cap',
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@rdo.mil.br' },
    update: {},
    create: {
      name: 'Supervisor de Estoque',
      email: 'supervisor@rdo.mil.br',
      passwordHash: await pass('super123'),
      role: 'SUPERVISOR',
      rank: '1º Sgt',
    },
  });

  await prisma.user.upsert({
    where: { email: 'operador@rdo.mil.br' },
    update: {},
    create: {
      name: 'Operador de Almoxarifado',
      email: 'operador@rdo.mil.br',
      passwordHash: await pass('oper123'),
      role: 'OPERADOR',
      rank: 'Cb',
    },
  });

  await prisma.user.upsert({
    where: { email: 'consulta@rdo.mil.br' },
    update: {},
    create: {
      name: 'Usuário Consulta',
      email: 'consulta@rdo.mil.br',
      passwordHash: await pass('consulta123'),
      role: 'CONSULTA',
    },
  });

  // --------------------------------------------------------------------- OMs
  const om1 = await prisma.om.upsert({
    where: { code: '1ºBIS' },
    update: {},
    create: { code: '1ºBIS', name: '1º Batalhão de Infantaria de Selva' },
  });
  await prisma.om.upsert({
    where: { code: 'BLog' },
    update: {},
    create: { code: 'BLog', name: 'Base Logística' },
  });

  // -------------------------------------------------------------- Categorias
  const cat1 = await prisma.category.upsert({
    where: { name: 'Solventes' },
    update: {},
    create: { name: 'Solventes', description: 'Solventes orgânicos e inorgânicos' },
  });
  const cat2 = await prisma.category.upsert({
    where: { name: 'Ácidos' },
    update: {},
    create: { name: 'Ácidos', description: 'Ácidos diversos' },
  });
  await prisma.category.upsert({
    where: { name: 'Desinfetantes' },
    update: {},
    create: { name: 'Desinfetantes' },
  });

  // ----------------------------------------------------------------- Estoque
  const stock1 = await prisma.stock.upsert({
    where: { code: 'EST-A01' },
    update: {},
    create: {
      code: 'EST-A01',
      name: 'Almoxarifado Central — Galpão A',
      location: 'Setor de Materiais Perigosos',
    },
  });
  const stock2 = await prisma.stock.upsert({
    where: { code: 'EST-B02' },
    update: {},
    create: {
      code: 'EST-B02',
      name: 'Depósito de Produtos Químicos — Galpão B',
      location: 'Área externa coberta',
    },
  });

  // ---------------------------------------------------------------- Produtos
  const soon = new Date();
  soon.setDate(soon.getDate() + 20);
  const expired = new Date();
  expired.setMonth(expired.getMonth() - 2);
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);

  const products = [
    {
      internalCode: 'QM-0001',
      name: 'Álcool Etílico 70%',
      brand: 'Itajá',
      manufacturer: 'Química Brasil',
      unit: 'L' as const,
      minStock: 20,
      maxStock: 200,
      currentQuantity: 150,
      casNumber: '64-17-5',
      isChemical: true,
      isRestricted: false,
      categoryId: cat1.id,
      stockId: stock1.id,
      batchNumber: 'LT-2024-001',
      expirationDate: future,
      physicalLocation: 'Prateleira A-3',
    },
    {
      internalCode: 'QM-0002',
      name: 'Ácido Clorídrico 37%',
      brand: 'Synth',
      manufacturer: 'LabSynth',
      unit: 'L' as const,
      minStock: 5,
      maxStock: 50,
      currentQuantity: 4,
      casNumber: '7647-01-0',
      isChemical: true,
      isRestricted: true,
      requiresAuth: true,
      categoryId: cat2.id,
      stockId: stock1.id,
      batchNumber: 'LT-2024-007',
      expirationDate: future,
      physicalLocation: 'Armário corrosivos C-1',
    },
    {
      internalCode: 'QM-0003',
      name: 'Hipoclorito de Sódio 12%',
      brand: 'Sanol',
      unit: 'L' as const,
      minStock: 10,
      maxStock: 100,
      currentQuantity: 60,
      casNumber: '7681-52-9',
      isChemical: true,
      stockId: stock2.id,
      batchNumber: 'LT-2024-015',
      expirationDate: soon,
      physicalLocation: 'Prateleira B-1',
    },
    {
      internalCode: 'QM-0004',
      name: 'Acetona P.A.',
      brand: 'Vetec',
      unit: 'L' as const,
      minStock: 8,
      maxStock: 40,
      currentQuantity: 25,
      casNumber: '67-64-1',
      isChemical: true,
      isRestricted: true,
      categoryId: cat1.id,
      stockId: stock2.id,
      batchNumber: 'LT-2023-099',
      expirationDate: expired,
      physicalLocation: 'Prateleira B-4',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { internalCode: p.internalCode },
      update: {},
      create: { ...p, createdById: admin.id },
    });
  }

  // ----------------------------------------------------- Movimentação exemplo
  const alcool = await prisma.product.findUnique({ where: { internalCode: 'QM-0001' } });
  if (alcool) {
    const existing = await prisma.movement.count({ where: { productId: alcool.id } });
    if (existing === 0) {
      await prisma.movement.create({
        data: {
          type: 'SAIDA',
          unit: 'L',
          quantity: 10,
          productId: alcool.id,
          stockId: stock1.id,
          omId: om1.id,
          responsibleId: supervisor.id,
          applicationSite: 'Enfermaria',
          previousBalance: 160,
          updatedBalance: 150,
          notes: 'Reposição mensal da enfermaria',
        },
      });
    }
  }

  console.log('✅ Seed concluído!');
  console.log('   Logins: admin@rdo.mil.br / admin123');
  console.log('           supervisor@rdo.mil.br / super123');
  console.log('           operador@rdo.mil.br / oper123');
  console.log('           consulta@rdo.mil.br / consulta123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
