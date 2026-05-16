import re

file_path = 'Frontend/src/components/pharmacy/pharmacy-dashboard.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Make it pop a toast when there's low stock items if not already done.
# We'll use useEffect for this.

# Import useEffect
if "useEffect" not in content:
    content = content.replace("useState } from 'react'", "useState, useEffect } from 'react'")

# Add useEffect hook inside PharmacyDashboard component
hook_insertion = """
  useEffect(() => {
    if (lowStockItems > 0 && !isLoading) {
      setNotification({
        type: 'warning',
        message: `¡Atención! Tienes ${lowStockItems} productos con stock bajo que requieren reabastecimiento.`
      });
    }
  }, [lowStockItems, isLoading, setNotification]);
"""

# Insert it before the isLoading check
content = content.replace("if (isLoading) {", hook_insertion + "\n  if (isLoading) {")

with open(file_path, 'w') as f:
    f.write(content)
