import re

file_path = 'Frontend/src/components/doctor/consultation.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add useCreateAppointment to imports
content = content.replace("useCreatePrescription,", "useCreateAppointment,\n  useCreatePrescription,")

# Add Calendar to imports if not there, Wait it is already there.

# In the component:
# const createPrescriptionMutation = useCreatePrescription();
# add const createAppointmentMutation = useCreateAppointment();
# const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
# const [followUpScheduled, setFollowUpScheduled] = useState(false);

content = content.replace(
    "const createPrescriptionMutation = useCreatePrescription();",
    "const createAppointmentMutation = useCreateAppointment();\n  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);\n  const [followUpScheduled, setFollowUpScheduled] = useState(false);\n  const createPrescriptionMutation = useCreatePrescription();"
)

# And add the handler:
handler = """
  const handleScheduleFollowUp = async () => {
    if (!appointment) return;
    try {
      setIsSchedulingFollowUp(true);
      const followUpDate = new Date();
      followUpDate.setMonth(followUpDate.getMonth() + 1);

      await createAppointmentMutation.mutateAsync({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        clinic_id: appointment.clinic_id,
        date_time: followUpDate.toISOString(),
        duration_minutes: 30,
        notes: 'Cita de seguimiento automática',
      });
      setFollowUpScheduled(true);
      setNotification({ type: 'success', message: 'Cita de seguimiento agendada para 1 mes' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al agendar cita de seguimiento' });
    } finally {
      setIsSchedulingFollowUp(false);
    }
  };
"""

content = content.replace(
    "const handleCreatePrescription = async () => {",
    handler + "\n  const handleCreatePrescription = async () => {"
)


# In step 4 Done:
step4_search = """          <p className="text-sm text-muted-foreground mb-6">
            La consulta ha sido marcada como completada.
          </p>
          <Button
            className="glass-btn-primary rounded-full"
            onClick={() => navigate('inicio')}
          >
            Volver al inicio
          </Button>"""

step4_replace = """          <p className="text-sm text-muted-foreground mb-6">
            La consulta ha sido marcada como completada.
          </p>
          <div className="space-y-3">
            {!followUpScheduled ? (
              <Button
                variant="outline"
                className="w-full rounded-full gap-2 border-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                onClick={handleScheduleFollowUp}
                disabled={isSchedulingFollowUp}
              >
                {isSchedulingFollowUp ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
                Agendar Seguimiento (1 mes)
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-teal-600 dark:text-teal-400 bg-teal-500/10 p-2 rounded-full">
                <CheckCircle2 className="size-4" />
                Seguimiento agendado
              </div>
            )}
            <Button
              className="glass-btn-primary w-full rounded-full"
              onClick={() => navigate('inicio')}
            >
              Volver al inicio
            </Button>
          </div>"""

content = content.replace(step4_search, step4_replace)

with open(file_path, 'w') as f:
    f.write(content)
