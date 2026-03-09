import { PrismaClient, AssetType, BuildJobStatus, PageStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.create({
    data: {
      name: 'Sample Documentation Project',
      slug: 'sample-documentation-project',
      description: 'A seeded project with two starter pages.',
      pages: {
        create: [
          {
            title: 'Home',
            slug: 'home',
            publicSlug: 'home',
            status: PageStatus.published,
            prompt: 'Create a welcoming home page with project overview.',
            referenceLinks: ['https://example.com/home-reference'],
            content: '# Welcome\n\nThis is the home page.',
            publishedAt: new Date(),
            versions: {
              create: {
                versionNumber: 1,
                instructionPrompt: 'Create a welcoming home page with project overview.',
                generatedSchemaJson: { sections: ['hero', 'features', 'cta'] },
                notes: 'Initial published version.'
              }
            }
          },
          {
            title: 'About',
            slug: 'about',
            publicSlug: 'about',
            status: PageStatus.draft,
            prompt: 'Draft an about page that explains the mission.',
            referenceLinks: ['https://example.com/about-reference'],
            content: '# About\n\nDraft content pending review.',
            versions: {
              create: {
                versionNumber: 1,
                instructionPrompt: 'Draft an about page that explains the mission.',
                generatedSchemaJson: { sections: ['mission', 'team'] },
                notes: 'Initial draft.'
              }
            }
          }
        ]
      }
    },
    include: {
      pages: {
        include: {
          versions: true
        }
      }
    }
  });

  const homePage = project.pages[0];
  const homeVersion = homePage?.versions[0];

  if (homePage && homeVersion) {
    await prisma.page.update({
      where: { id: homePage.id },
      data: { currentVersionId: homeVersion.id }
    });
  }

  await prisma.asset.create({
    data: {
      projectId: project.id,
      pageId: homePage?.id,
      type: AssetType.logo,
      fileName: 'logo.svg',
      mimeType: 'image/svg+xml',
      storageUrl: 'https://example.com/assets/logo.svg'
    }
  });

  await prisma.buildJob.create({
    data: {
      projectId: project.id,
      pageId: homePage?.id,
      versionId: homeVersion?.id,
      status: BuildJobStatus.completed,
      startedAt: new Date(Date.now() - 60_000),
      finishedAt: new Date(),
      errorMessage: null
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
