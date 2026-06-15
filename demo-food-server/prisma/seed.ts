import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

const menuItems = [
  {
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice cooked with tender chicken and traditional spices',
    rate: 14.99,
    category: 'Main Course',
    available: true,
  },
  {
    name: 'Butter Chicken with Naan',
    description:
      'Creamy tomato-based curry with succulent chicken pieces, served with fresh naan bread',
    rate: 16.99,
    category: 'Main Course',
    available: true,
  },
  {
    name: 'Vegetable Samosas (6 pcs)',
    description: 'Crispy pastry filled with spiced potatoes and peas',
    rate: 8.99,
    category: 'Appetizer',
    available: true,
  },
  {
    name: 'Masala Chai Tea',
    description: 'Traditional Indian spiced tea with milk',
    rate: 3.99,
    category: 'Beverage',
    available: true,
  },
  {
    name: 'Tandoori Chicken',
    description: 'Marinated chicken cooked in a clay oven with traditional spices',
    rate: 18.99,
    category: 'Main Course',
    available: true,
  },
  {
    name: 'Palak Paneer',
    description: 'Fresh cottage cheese cubes in a creamy spinach curry',
    rate: 13.99,
    category: 'Main Course',
    available: true,
  },
  {
    name: 'Gulab Jamun (4 pcs)',
    description: 'Sweet milk dumplings soaked in rose-flavored syrup',
    rate: 6.99,
    category: 'Dessert',
    available: true,
  },
  {
    name: 'Mango Lassi',
    description: 'Refreshing yogurt-based drink with sweet mango',
    rate: 4.99,
    category: 'Beverage',
    available: true,
  },
  {
    name: 'Chicken Tikka Masala',
    description: 'Grilled chicken chunks in a creamy tomato-based sauce',
    rate: 15.99,
    category: 'Main Course',
    available: true,
  },
  {
    name: 'Garlic Naan',
    description: 'Fresh flatbread topped with garlic and butter',
    rate: 3.49,
    category: 'Bread',
    available: true,
  },
]

async function main() {
  console.log('Seeding database...')

  // Menu items: only seed when the table is empty so re-running is safe.
  const existingMenu = await prisma.menuItem.count()
  if (existingMenu === 0) {
    await prisma.menuItem.createMany({ data: menuItems })
    console.log(`  Inserted ${menuItems.length} menu items`)
  } else {
    console.log(`  Menu already has ${existingMenu} items, skipping`)
  }

  // Promote configured emails to ADMIN / STAFF so you can log in to the dashboards.
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const staffEmails = (process.env.STAFF_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  for (const email of adminEmails) {
    await prisma.user.upsert({
      where: { email },
      update: { role: Role.ADMIN },
      create: { email, role: Role.ADMIN },
    })
    console.log(`  Ensured ADMIN: ${email}`)
  }
  for (const email of staffEmails) {
    await prisma.user.upsert({
      where: { email },
      update: { role: Role.STAFF },
      create: { email, role: Role.STAFF },
    })
    console.log(`  Ensured STAFF: ${email}`)
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
