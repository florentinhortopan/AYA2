import { PrismaClient, Prisma } from '@prisma/client'
import { ACTIVITIES, CRITERIA } from '../lib/content-testing/catalog'

const prisma = new PrismaClient()

async function seedContentTestingCatalog() {
  console.log('[seed] Content Testing — criteria…')
  for (const c of CRITERIA) {
    await prisma.contentTestCriterion.upsert({
      where: { key: c.key },
      create: {
        key: c.key,
        label: c.label,
        definition: c.definition,
        order: c.order,
        alwaysRequired: c.alwaysRequired,
      },
      update: {
        label: c.label,
        definition: c.definition,
        order: c.order,
        alwaysRequired: c.alwaysRequired,
      },
    })
  }

  console.log('[seed] Content Testing — activities…')
  for (const a of ACTIVITIES) {
    const followUp: Prisma.InputJsonValue | typeof Prisma.JsonNull = a.followUpQuestions
      ? (a.followUpQuestions as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull
    const warmup: Prisma.InputJsonValue | typeof Prisma.JsonNull = a.warmupQuestions
      ? (a.warmupQuestions as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull
    const wrapUp: Prisma.InputJsonValue | typeof Prisma.JsonNull = a.wrapUpQuestions
      ? (a.wrapUpQuestions as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull

    await prisma.contentTestActivity.upsert({
      where: { slug: a.slug },
      create: {
        slug: a.slug,
        order: a.order,
        title: a.title,
        objective: a.objective,
        script: a.script ?? null,
        instructions: a.instructions ?? null,
        useCaseCategory: a.useCaseCategory as any,
        requiredCriteria: a.requiredCriteria,
        capturesPrompts: a.capturesPrompts,
        isSensitive: !!a.isSensitive,
        isAdversarial: !!a.isAdversarial,
        followUpQuestions: followUp,
        warmupQuestions: warmup,
        wrapUpQuestions: wrapUp,
      },
      update: {
        order: a.order,
        title: a.title,
        objective: a.objective,
        script: a.script ?? null,
        instructions: a.instructions ?? null,
        useCaseCategory: a.useCaseCategory as any,
        requiredCriteria: a.requiredCriteria,
        capturesPrompts: a.capturesPrompts,
        isSensitive: !!a.isSensitive,
        isAdversarial: !!a.isAdversarial,
        followUpQuestions: followUp,
        warmupQuestions: warmup,
        wrapUpQuestions: wrapUp,
      },
    })
  }

  console.log('[seed] Content Testing — prompt bank…')
  // Idempotent: clear archived flag on existing items by promptText, insert new ones
  for (const a of ACTIVITIES) {
    if (!a.promptBank?.length) continue
    for (const p of a.promptBank) {
      const existing = await prisma.contentTestPromptBankItem.findFirst({
        where: { activitySlug: a.slug, promptText: p.promptText },
      })
      if (existing) {
        await prisma.contentTestPromptBankItem.update({
          where: { id: existing.id },
          data: {
            topicArea: (p.topicArea ?? null) as any,
            isArchived: false,
          },
        })
      } else {
        await prisma.contentTestPromptBankItem.create({
          data: {
            activitySlug: a.slug,
            promptText: p.promptText,
            topicArea: (p.topicArea ?? null) as any,
            isArchived: false,
          },
        })
      }
    }
  }
}

async function ensureBootstrapAdmin() {
  const adminEmail = process.env.CONTENT_TESTING_ADMIN_EMAIL
  if (!adminEmail) return
  const user = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (user && user.role !== 'ADMIN') {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
    console.log(`[seed] Promoted ${adminEmail} to ADMIN`)
  }
}

async function main() {
  await seedContentTestingCatalog()
  await ensureBootstrapAdmin()
  console.log('[seed] Done.')
}

main()
  .catch((err) => {
    console.error('[seed] Error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
