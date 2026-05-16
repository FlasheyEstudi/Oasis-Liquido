import re

file_path = 'Backend/src/lib/services/pharmacy.service.ts'
with open(file_path, 'r') as f:
    content = f.read()

# We need to change the findMany to also include the inventory that matches the medicineIds if passed,
# so we can count how many matched.

search_str = """  let pharmacies = await db.pharmacy.findMany({
    where,
    include: {
      _count: { select: { inventory: true, sales: true } },
    },
    orderBy: { name: 'asc' },
  });"""

replace_str = """  let pharmacies = await db.pharmacy.findMany({
    where,
    include: {
      _count: { select: { inventory: true, sales: true } },
      ...(filters.medicineIds && filters.medicineIds.length > 0 ? {
        inventory: {
          where: {
            medicineId: { in: filters.medicineIds },
            quantity: { gt: 0 }
          },
          select: { medicineId: true, quantity: true }
        }
      } : {})
    },
    orderBy: { name: 'asc' },
  });

  // Calculate matchedMedicinesCount
  if (filters.medicineIds && filters.medicineIds.length > 0) {
    pharmacies = pharmacies.map(p => ({
      ...p,
      matchedMedicinesCount: (p as any).inventory?.length || 0,
      matchedMedicines: (p as any).inventory?.map((i: any) => i.medicineId) || [],
    }));
  }
"""

content = content.replace(search_str, replace_str)

with open(file_path, 'w') as f:
    f.write(content)
