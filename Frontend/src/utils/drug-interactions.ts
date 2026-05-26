// =========================================================
// OASIS - Drug Interaction Checker Engine
// - Maps dangerous interactions based on drug names/generic names
// - Provides rich clinical severity levels (CRITICAL, MODERATE, INFORMATIONAL)
// =========================================================

export interface DrugInteractionRule {
  drugA: string; // Substring or exact match in name/genericName
  drugB: string;
  severity: 'critical' | 'moderate' | 'informational';
  description: string;
}

export const DRUG_INTERACTION_RULES: DrugInteractionRule[] = [
  {
    drugA: 'Ibuprofeno',
    drugB: 'Paracetamol',
    severity: 'moderate',
    description: 'El uso concomitante prolongado de AINEs con Paracetamol incrementa el riesgo de toxicidad renal. Se recomienda monitorear la función renal y espaciar las tomas.'
  },
  {
    drugA: 'Atorvastatina',
    drugB: 'Eritromicina',
    severity: 'critical',
    description: 'Interacción CRÍTICA: La Eritromicina aumenta significativamente la concentración plasmática de Atorvastatina, incrementando gravemente el riesgo de miopatía y rabdomiólisis.'
  },
  {
    drugA: 'Metformina',
    drugB: 'Contraste',
    severity: 'critical',
    description: 'Interacción CRÍTICA: Suspenda la Metformina antes o al momento del estudio con contraste yodado, y no la reanude hasta 48 horas después para evitar acidosis láctica.'
  },
  {
    drugA: 'Amoxicilina',
    drugB: 'Metotrexato',
    severity: 'critical',
    description: 'Interacción CRÍTICA: Las penicilinas pueden reducir la excreción renal de Metotrexato, aumentando el riesgo de toxicidad hematológica grave.'
  },
  {
    drugA: 'Ibuprofeno',
    drugB: 'Aspirina',
    severity: 'moderate',
    description: 'El Ibuprofeno puede atenuar el efecto cardioprotector de dosis bajas de Aspirina y aumentar el riesgo de ulceración gastrointestinal.'
  },
  {
    drugA: 'Loratadina',
    drugB: 'Ketoconazol',
    severity: 'moderate',
    description: 'El Ketoconazol incrementa las concentraciones de Loratadina en sangre. Monitorear posibles efectos secundarios cardiovasculares.'
  }
];

export interface FoundInteraction {
  medicineA: { id: string; name: string };
  medicineB: { id: string; name: string };
  severity: 'critical' | 'moderate' | 'informational';
  description: string;
}

/**
 * Validates selected prescription medicines against known clinical interaction rules.
 */
export function checkDrugInteractions(
  selectedMedicineIds: string[],
  medicinesCatalog: Array<{ id: string; name: string; genericName?: string | null }>
): FoundInteraction[] {
  const found: FoundInteraction[] = [];
  
  // Resolve selected medicine details
  const selectedMedications = selectedMedicineIds
    .map(id => medicinesCatalog.find(m => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  // Compare every pair
  for (let i = 0; i < selectedMedications.length; i++) {
    for (let j = i + 1; j < selectedMedications.length; j++) {
      const medA = selectedMedications[i];
      const medB = selectedMedications[j];

      // Check rules
      for (const rule of DRUG_INTERACTION_RULES) {
        const matchesA = 
          medA.name.toLowerCase().includes(rule.drugA.toLowerCase()) || 
          (medA.genericName && medA.genericName.toLowerCase().includes(rule.drugA.toLowerCase()));
        
        const matchesB = 
          medB.name.toLowerCase().includes(rule.drugB.toLowerCase()) || 
          (medB.genericName && medB.genericName.toLowerCase().includes(rule.drugB.toLowerCase()));

        // Also check reverse comparison (since pairs are commutative)
        const reverseMatchesA = 
          medA.name.toLowerCase().includes(rule.drugB.toLowerCase()) || 
          (medA.genericName && medA.genericName.toLowerCase().includes(rule.drugB.toLowerCase()));
        
        const reverseMatchesB = 
          medB.name.toLowerCase().includes(rule.drugA.toLowerCase()) || 
          (medB.genericName && medB.genericName.toLowerCase().includes(rule.drugA.toLowerCase()));

        if ((matchesA && matchesB) || (reverseMatchesA && reverseMatchesB)) {
          found.push({
            medicineA: { id: medA.id, name: medA.name },
            medicineB: { id: medB.id, name: medB.name },
            severity: rule.severity,
            description: rule.description
          });
        }
      }
    }
  }

  return found;
}
