import re

file_path = 'Frontend/src/components/doctor/consultation.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Import the lucide icon "MessageCircle" for whatsapp if not present
if "MessageCircle" not in content:
    content = content.replace("Stethoscope,", "Stethoscope,\n  MessageCircle,")

# We want to add a button next to the appointment info in the left column.
# Let's find: {/* Left Column - Patient info */} and add the button below the patient contact details.
search_str = """                </div>
              </div>
            </div>

            <Separator className="bg-teal-500/10" />"""

replace_str = """                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 mt-2 bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20"
              onClick={() => {
                const phone = patient?.phone || patientProfile?.emergency_phone;
                if (!phone) {
                  setNotification({ type: 'error', message: 'El paciente no tiene número de teléfono registrado' });
                  return;
                }
                const message = `Hola, soy el Dr. ${user?.name}. Iniciemos su consulta médica por telemedicina.`;
                window.open(`https://wa.me/${phone.replace(/\\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
              }}
            >
              <MessageCircle className="size-4" />
              Iniciar Telemedicina (WhatsApp)
            </Button>

            <Separator className="bg-teal-500/10" />"""

content = content.replace(search_str, replace_str)

with open(file_path, 'w') as f:
    f.write(content)
