import { PrismaClient, AssetType, BuildJobStatus, PageStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.create({
    data: {
      name: 'Sample Documentation Project',
      description: 'A seeded project with two starter pages.',
      pages: {
        create: [
          {
            title: 'Home',
            slug: 'home',
            status: PageStatus.published,
            content: '# Welcome\n\nThis is the home page.',
            publishedAt: new Date(),
            versions: {
              create: {
                version: 1,
                title: 'Home',
                content: '# Welcome\n\nThis is the home page.',
                changelog: 'Initial published version.'
              }
            }
          },
          {
            title: 'About',
            slug: 'about',
            status: PageStatus.draft,
            content: '# About\n\nDraft content pending review.',
            versions: {
              create: {
                version: 1,
                title: 'About',
                content: '# About\n\nDraft content pending review.',
                changelog: 'Initial draft.'
              }
            }
          }
        ]
      }
    },
    include: {
      pages: true
    }
  });

  await prisma.asset.create({
    data: {
      projectId: project.id,
      pageId: project.pages[0]?.id,
      type: AssetType.logo,
      name: 'Primary logo',
      url: 'https://example.com/assets/logo.svg'
    }
  });

  await prisma.buildJob.create({
    data: {
      projectId: project.id,
      pageId: project.pages[0]?.id,
      status: BuildJobStatus.completed,
      startedAt: new Date(Date.now() - 60_000),
      completedAt: new Date(),
      log: 'Seed build completed successfully.'
    }
  });

  console.log(`Seeded project ${project.name} (${project.id}) with ${project.pages.length} pages.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
