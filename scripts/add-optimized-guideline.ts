import { prisma } from '../lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

async function addOptimizedGuideline() {
  try {
    // Read the optimized guideline file
    const guidelinePath = join(process.cwd(), 'app/content/prompts/Guideline-Optimized.md')
    const guidelineContent = await readFile(guidelinePath, 'utf-8')

    // Check if a guideline with this name already exists
    const existing = await prisma.contentGuideline.findFirst({
      where: {
        name: 'U.S. Army Q&A Generation Guidelines (Optimized)'
      }
    })

    if (existing) {
      console.log('⚠️  Guideline with this name already exists.')
      console.log(`   ID: ${existing.id}`)
      console.log(`   Version: ${existing.version}`)
      console.log('   Updating to new version...')
      
      // Update existing guideline
      const updated = await prisma.contentGuideline.update({
        where: { id: existing.id },
        data: {
          content: guidelineContent,
          version: '2.0',
          isActive: true, // Set as active
          updatedAt: new Date()
        }
      })
      
      console.log('✅ Successfully updated guideline:')
      console.log(`   ID: ${updated.id}`)
      console.log(`   Name: ${updated.name}`)
      console.log(`   Version: ${updated.version}`)
      console.log(`   Active: ${updated.isActive}`)
      console.log(`   Content length: ${updated.content.length} characters`)
    } else {
      // Create new guideline
      const guideline = await prisma.contentGuideline.create({
        data: {
          name: 'U.S. Army Q&A Generation Guidelines (Optimized)',
          content: guidelineContent,
          version: '2.0',
          isActive: true
        }
      })

      console.log('✅ Successfully created new guideline:')
      console.log(`   ID: ${guideline.id}`)
      console.log(`   Name: ${guideline.name}`)
      console.log(`   Version: ${guideline.version}`)
      console.log(`   Active: ${guideline.isActive}`)
      console.log(`   Content length: ${guideline.content.length} characters`)
    }

    // List all guidelines
    const allGuidelines = await prisma.contentGuideline.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        version: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log('\n📋 All guidelines in database:')
    allGuidelines.forEach((g, index) => {
      console.log(`   ${index + 1}. ${g.name} (v${g.version}) ${g.isActive ? '✅ Active' : '❌ Inactive'}`)
    })

  } catch (error) {
    console.error('❌ Error adding guideline:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addOptimizedGuideline()
