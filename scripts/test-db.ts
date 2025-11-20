import { prisma } from '../lib/db'

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...\n')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Successfully connected to database!')
    
    // Test query
    const userCount = await prisma.user.count()
    console.log(`📊 Current users in database: ${userCount}`)
    
    // Test schema - try to query each main table
    console.log('\n📋 Checking database tables...')
    
    const tables = {
      'User': prisma.user.count(),
      'Profile': prisma.profile.count(),
      'AgentSession': prisma.agentSession.count(),
      'Achievement': prisma.achievement.count(),
      'Content': prisma.content.count(),
      'TrainingLog': prisma.trainingLog.count(),
      'UserProgress': prisma.userProgress.count(),
      'FinancialData': prisma.financialData.count(),
    }
    
    for (const [tableName, query] of Object.entries(tables)) {
      try {
        const count = await query
        console.log(`  ✅ ${tableName}: ${count} records`)
      } catch (error: any) {
        console.log(`  ❌ ${tableName}: Error - ${error.message}`)
      }
    }
    
    console.log('\n🎉 Database connection test completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('   - Run: npm run dev')
    console.log('   - Visit: http://localhost:3000')
    console.log('   - Or open Prisma Studio: npx prisma studio')
    
  } catch (error: any) {
    console.error('\n❌ Database connection failed!')
    console.error('Error:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('   1. Check your .env file has DATABASE_URL and DIRECT_URL set')
    console.error('   2. Verify your Vercel Postgres connection strings are correct')
    console.error('   3. Make sure you ran: npx prisma generate')
    console.error('   4. Make sure you ran: npx prisma db push')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

